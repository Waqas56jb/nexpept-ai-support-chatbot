import { Router } from 'express'
import { pool, TABLES } from '../db.js'
import { mapConversation, mapMessage, settingsRowToApi, mapKnowledge } from '../utils/transform.js'
import { badRequest, notFound } from '../utils/http.js'
import { insertMessage, listMessages } from '../services/conversationService.js'
import { requestHandoff, getConversationRow, findActiveHandoff } from '../services/handoffService.js'
import { generateReply, isHandoffPhrase } from '../services/aiService.js'

const router = Router()

router.get('/settings', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ${TABLES.settings} ORDER BY updated_at DESC LIMIT 1`,
    )
    const api = settingsRowToApi(rows[0] || {})
    res.json({
      brandName: api.brandName,
      greeting: api.greeting,
      headerTitle: api.headerTitle,
      agentName: api.agentName,
      agentAvatar: api.agentAvatar,
      whatsappUrl: api.whatsappUrl,
      instagramUrl: api.instagramUrl,
      showFaqs: api.showFaqs,
      enableHumanHandoff: api.enableHumanHandoff,
      widgetEnabled: api.widgetEnabled !== false,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/faqs', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ${TABLES.knowledge}
       WHERE type = 'faq' AND status = 'published'
       ORDER BY updated_at DESC`,
    )
    res.json(
      rows.map((r) => {
        const k = mapKnowledge(r)
        return { id: k.id, title: k.title, body: k.body }
      }),
    )
  } catch (err) {
    next(err)
  }
})

router.post('/start', async (req, res, next) => {
  try {
    const { rows: settingsRows } = await pool.query(
      `SELECT * FROM ${TABLES.settings} ORDER BY updated_at DESC LIMIT 1`,
    )
    const chatSettings = settingsRowToApi(settingsRows[0] || {})
    if (chatSettings.widgetEnabled === false) {
      throw badRequest('Chatbot is currently disabled')
    }

    const name = String(req.body?.name || '').trim()
    const email = String(req.body?.email || '').trim().toLowerCase()
    const phone = String(req.body?.phone || '').trim()
    const countryCode = req.body?.countryCode

    if (!name || !email || !phone) {
      throw badRequest('name, email, and phone are required')
    }

    const fullPhone = countryCode ? `${countryCode} ${phone}` : phone

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      let leadId
      const { rows: existingLeads } = await client.query(
        `SELECT id FROM ${TABLES.leads} WHERE lower(email) = $1 LIMIT 1`,
        [email],
      )

      if (existingLeads.length) {
        leadId = existingLeads[0].id
        await client.query(
          `UPDATE ${TABLES.leads}
           SET name = $2, phone = $3, last_seen_at = now(), updated_at = now(),
               conversation_count = conversation_count + 1
           WHERE id = $1`,
          [leadId, name, fullPhone],
        )
      } else {
        const { rows: leadRows } = await client.query(
          `INSERT INTO ${TABLES.leads} (name, email, phone, source, status, conversation_count, last_seen_at)
           VALUES ($1, $2, $3, 'website', 'new', 1, now())
           RETURNING id`,
          [name, email, fullPhone],
        )
        leadId = leadRows[0].id
      }

      const subject = `Website chat — ${name}`
      const { rows: convRows } = await client.query(
        `INSERT INTO ${TABLES.conversations}
         (lead_id, channel, status, ai_enabled, customer_name, customer_email, customer_phone, subject)
         VALUES ($1, 'website', 'ai_handling', true, $2, $3, $4, $5)
         RETURNING *`,
        [leadId, name, email, fullPhone, subject],
      )
      const conv = convRows[0]

      const welcome = `Hi ${name}! Thanks for reaching out to NexPept. Ask a quick question, pick an FAQ, or tap "Speak with team member".`
      const { rows: msgRows } = await client.query(
        `INSERT INTO ${TABLES.messages}
         (conversation_id, sender_type, content, visibility, ai_generated)
         VALUES ($1, 'ai', $2, 'public', true)
         RETURNING *`,
        [conv.id, welcome],
      )

      await client.query(
        `UPDATE ${TABLES.conversations}
         SET last_message = $2, last_message_at = now(), updated_at = now()
         WHERE id = $1`,
        [conv.id, welcome],
      )

      await client.query('COMMIT')

      res.status(201).json({
        conversationId: conv.id,
        leadId,
        messages: [mapMessage(msgRows[0])],
        conversation: mapConversation(conv, null),
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    next(err)
  }
})

router.get('/:conversationId/messages', async (req, res, next) => {
  try {
    const conv = await getConversationRow(req.params.conversationId)
    if (!conv) throw notFound('Conversation not found')
    const messages = await listMessages(req.params.conversationId, { publicOnly: true })
    res.json({ messages })
  } catch (err) {
    next(err)
  }
})

router.post('/:conversationId/handoff', async (req, res, next) => {
  try {
    const result = await requestHandoff(
      req.params.conversationId,
      req.body?.reason || 'Customer requested human agent',
    )
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/:conversationId/message', async (req, res, next) => {
  try {
    const content = String(req.body?.content || '').trim()
    if (!content) throw badRequest('content is required')

    const conv = await getConversationRow(req.params.conversationId)
    if (!conv) throw notFound('Conversation not found')

    const customerMsg = await insertMessage({
      conversationId: conv.id,
      senderType: 'customer',
      content,
      visibility: 'public',
    })

    /** @type {import('../utils/transform.js').mapMessage[]} */
    const newMessages = [customerMsg]

    if (isHandoffPhrase(content)) {
      const handoffResult = await requestHandoff(conv.id, content)
      const reply = await insertMessage({
        conversationId: conv.id,
        senderType: 'ai',
        content:
          'Got it — a team member has been notified. I can keep helping with product questions in the meantime, or you can wait for a human reply.',
        visibility: 'public',
        aiGenerated: true,
      })
      if (reply) newMessages.push(reply)
      return res.json({
        messages: newMessages,
        conversation: handoffResult.conversation,
      })
    }

    // Agent has claimed — acknowledge and stop generating AI answers
    if (!conv.ai_enabled) {
      const reply = await insertMessage({
        conversationId: conv.id,
        senderType: 'ai',
        content:
          'Thanks — a team member has this conversation and will reply here shortly.',
        visibility: 'public',
        aiGenerated: true,
      })
      if (reply) newMessages.push(reply)
      return res.json({
        messages: newMessages,
        conversation: mapConversation(
          await getConversationRow(conv.id),
          (await findActiveHandoff(conv.id))?.id ?? null,
        ),
      })
    }

    const history = await listMessages(conv.id, { publicOnly: true })
    const aiText = await generateReply(content, {
      history,
      customerName: conv.customer_name || '',
    })
    const aiMsg = await insertMessage({
      conversationId: conv.id,
      senderType: 'ai',
      content: aiText,
      visibility: 'public',
      aiGenerated: true,
    })
    if (aiMsg) newMessages.push(aiMsg)

    const updated = await getConversationRow(conv.id)
    const handoff = await findActiveHandoff(conv.id)

    res.json({
      messages: newMessages,
      conversation: mapConversation(updated, handoff?.id ?? null),
    })
  } catch (err) {
    next(err)
  }
})

export default router
