import { Router } from 'express'
import { pool, TABLES } from '../db.js'
import { mapConversation } from '../utils/transform.js'
import { badRequest, notFound, getAgentId } from '../utils/http.js'
import {
  attachHandoffIds,
  insertMessage,
  listMessages,
} from '../services/conversationService.js'
import {
  requestHandoff,
  claimHandoffByConversation,
  claimHandoffById,
  resolveActiveHandoff,
  cancelActiveHandoffs,
  getConversationRow,
  findActiveHandoff,
} from '../services/handoffService.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { status, channel, search, assignedTo, assignedAgentId } = req.query
    const assigned = assignedTo || assignedAgentId

    const clauses = []
    const params = []

    if (status) {
      params.push(status)
      clauses.push(`status = $${params.length}`)
    }
    if (channel) {
      params.push(channel)
      clauses.push(`channel = $${params.length}`)
    }
    if (assigned) {
      params.push(assigned)
      clauses.push(`assigned_agent_id = $${params.length}`)
    }
    if (search) {
      params.push(`%${String(search).toLowerCase()}%`)
      clauses.push(
        `(lower(subject) LIKE $${params.length} OR lower(customer_name) LIKE $${params.length} OR lower(customer_email) LIKE $${params.length})`,
      )
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const { rows } = await pool.query(
      `SELECT * FROM ${TABLES.conversations} ${where}
       ORDER BY coalesce(last_message_at, created_at) DESC`,
      params,
    )

    res.json(await attachHandoffIds(rows))
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const row = await getConversationRow(req.params.id)
    if (!row) throw notFound('Conversation not found')
    const handoff = await findActiveHandoff(row.id)
    res.json(mapConversation(row, handoff?.id ?? null))
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const patch = req.body || {}
    const allowed = [
      'status',
      'priority',
      'assigned_agent_id',
      'ai_enabled',
      'subject',
      'tags',
      'customer_name',
      'customer_email',
      'customer_phone',
      'customer_handle',
    ]

    const sets = []
    const params = [req.params.id]

    const camelToSnake = {
      assignedAgentId: 'assigned_agent_id',
      aiEnabled: 'ai_enabled',
      customerName: 'customer_name',
      customerEmail: 'customer_email',
      customerPhone: 'customer_phone',
      customerHandle: 'customer_handle',
    }

    for (const [key, value] of Object.entries(patch)) {
      const col = camelToSnake[key] || key
      if (!allowed.includes(col)) continue
      params.push(value)
      sets.push(`${col} = $${params.length}`)
    }

    if (!sets.length) throw badRequest('No valid fields to update')

    sets.push('updated_at = now()')
    const { rows } = await pool.query(
      `UPDATE ${TABLES.conversations} SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
      params,
    )
    if (!rows.length) throw notFound('Conversation not found')
    const handoff = await findActiveHandoff(rows[0].id)
    res.json(mapConversation(rows[0], handoff?.id ?? null))
  } catch (err) {
    next(err)
  }
})

router.get('/:id/messages', async (req, res, next) => {
  try {
    const conv = await getConversationRow(req.params.id)
    if (!conv) throw notFound('Conversation not found')
    res.json(await listMessages(req.params.id))
  } catch (err) {
    next(err)
  }
})

router.post('/:id/messages', async (req, res, next) => {
  try {
    const conv = await getConversationRow(req.params.id)
    if (!conv) throw notFound('Conversation not found')

    const senderType = req.body?.senderType || 'agent'
    const visibility = req.body?.visibility === 'internal' ? 'internal' : 'public'
    const agentId = getAgentId(req)

    const message = await insertMessage({
      conversationId: req.params.id,
      senderType,
      senderId: senderType === 'agent' ? agentId : null,
      content: req.body?.content,
      visibility,
    })

    if (!message) throw badRequest('Message content is required')
    res.status(201).json(message)
  } catch (err) {
    next(err)
  }
})

router.post('/:id/handoff', async (req, res, next) => {
  try {
    const result = await requestHandoff(
      req.params.id,
      req.body?.reason || 'Customer requested human agent',
    )
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/:id/claim', async (req, res, next) => {
  try {
    const agentId = req.body?.agentId || getAgentId(req)
    if (!agentId) throw badRequest('agentId is required')

    const result = await claimHandoffByConversation(req.params.id, agentId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/:id/resolve', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE ${TABLES.conversations}
       SET status = 'resolved', unread_count = 0, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [req.params.id],
    )
    if (!rows.length) throw notFound('Conversation not found')
    await resolveActiveHandoff(req.params.id)
    const handoff = await findActiveHandoff(req.params.id)
    res.json(mapConversation(rows[0], handoff?.id ?? null))
  } catch (err) {
    next(err)
  }
})

router.post('/:id/reopen', async (req, res, next) => {
  try {
    const row = await getConversationRow(req.params.id)
    if (!row) throw notFound('Conversation not found')
    const nextStatus = row.assigned_agent_id ? 'assigned' : 'open'
    const { rows } = await pool.query(
      `UPDATE ${TABLES.conversations}
       SET status = $2, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, nextStatus],
    )
    const handoff = await findActiveHandoff(req.params.id)
    res.json(mapConversation(rows[0], handoff?.id ?? null))
  } catch (err) {
    next(err)
  }
})

router.post('/:id/return-to-ai', async (req, res, next) => {
  try {
    const row = await getConversationRow(req.params.id)
    if (!row) throw notFound('Conversation not found')

    await cancelActiveHandoffs(req.params.id)

    const { rows } = await pool.query(
      `UPDATE ${TABLES.conversations}
       SET status = 'ai_handling', ai_enabled = true, assigned_agent_id = NULL, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [req.params.id],
    )

    await insertMessage({
      conversationId: req.params.id,
      senderType: 'system',
      content: 'Conversation returned to AI assistant.',
      visibility: 'internal',
    })

    res.json(mapConversation(rows[0], null))
  } catch (err) {
    next(err)
  }
})

export default router
