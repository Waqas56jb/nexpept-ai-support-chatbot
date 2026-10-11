import { pool, TABLES } from '../db.js'
import { mapConversation, mapHandoff } from '../utils/transform.js'
import { notFound, conflict } from '../utils/http.js'

const ACTIVE_HANDOFF_STATUSES = ['pending', 'claimed']

export async function findActiveHandoff(conversationId, client = pool) {
  const { rows } = await client.query(
    `SELECT * FROM ${TABLES.handoffs}
     WHERE conversation_id = $1 AND status = ANY($2::text[])
     ORDER BY requested_at DESC
     LIMIT 1`,
    [conversationId, ACTIVE_HANDOFF_STATUSES],
  )
  return rows[0] || null
}

export async function getConversationRow(id, client = pool) {
  const { rows } = await client.query(
    `SELECT * FROM ${TABLES.conversations} WHERE id = $1`,
    [id],
  )
  return rows[0] || null
}

/**
 * @param {string} conversationId
 * @param {string} reason
 * @param {import('pg').PoolClient} [externalClient]
 */
export async function requestHandoff(conversationId, reason) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const conv = await getConversationRow(conversationId, client)
    if (!conv) throw notFound('Conversation not found')

    let handoff = await findActiveHandoff(conversationId, client)

    if (!handoff) {
      const { rows } = await client.query(
        `INSERT INTO ${TABLES.handoffs} (conversation_id, reason, status, requested_at)
         VALUES ($1, $2, 'pending', now())
         RETURNING *`,
        [conversationId, reason || 'Customer requested human agent'],
      )
      handoff = rows[0]

      // Keep AI assisting until an agent claims — handoff only notifies the team
      await client.query(
        `UPDATE ${TABLES.conversations}
         SET status = 'handoff_pending', handoff_requested_at = now(), updated_at = now()
         WHERE id = $1`,
        [conversationId],
      )

      const systemContent = 'Conversation queued for human handoff.'
      await client.query(
        `INSERT INTO ${TABLES.messages}
         (conversation_id, sender_type, content, visibility, message_type)
         VALUES ($1, 'system', $2, 'internal', 'text')`,
        [conversationId, systemContent],
      )

      await client.query(
        `INSERT INTO ${TABLES.notifications} (type, title, body, conversation_id)
         VALUES ('handoff', 'Handoff waiting', $1, $2)`,
        [
          `${conv.customer_name || 'Customer'} — ${conv.subject || 'Support chat'}`,
          conversationId,
        ],
      )
    } else if (conv.status !== 'handoff_pending' && conv.status !== 'assigned') {
      const nextStatus = handoff.status === 'claimed' ? 'assigned' : 'handoff_pending'
      await client.query(
        `UPDATE ${TABLES.conversations}
         SET status = $2, ai_enabled = $3, updated_at = now()
         WHERE id = $1`,
        [conversationId, nextStatus, nextStatus !== 'assigned'],
      )
    }

    await client.query('COMMIT')

    const updatedConv = await getConversationRow(conversationId)
    return {
      conversation: mapConversation(updatedConv, handoff.id),
      handoff: mapHandoff(handoff),
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function claimHandoffByConversation(conversationId, agentId) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const handoff = await findActiveHandoff(conversationId, client)
    if (!handoff) throw notFound('No active handoff for this conversation')
    if (handoff.status !== 'pending') {
      throw conflict('Handoff is not available to claim')
    }

    const { rows: agents } = await client.query(
      `SELECT id FROM ${TABLES.agents} WHERE id = $1`,
      [agentId],
    )
    if (!agents.length) throw notFound('Agent not found')

    const { rows: updatedHandoffs } = await client.query(
      `UPDATE ${TABLES.handoffs}
       SET status = 'claimed', claimed_by = $2, claimed_at = now()
       WHERE id = $1
       RETURNING *`,
      [handoff.id, agentId],
    )

    await client.query(
      `UPDATE ${TABLES.conversations}
       SET status = 'assigned', assigned_agent_id = $2, ai_enabled = false, updated_at = now()
       WHERE id = $1`,
      [conversationId, agentId],
    )

    await client.query('COMMIT')

    const conv = await getConversationRow(conversationId)
    return {
      handoff: mapHandoff(updatedHandoffs[0]),
      conversation: conv ? mapConversation(conv, handoff.id) : null,
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function claimHandoffById(handoffId, agentId) {
  const { rows } = await pool.query(
    `SELECT conversation_id FROM ${TABLES.handoffs} WHERE id = $1`,
    [handoffId],
  )
  if (!rows.length) throw notFound('Handoff not found')
  return claimHandoffByConversation(rows[0].conversation_id, agentId)
}

/** @param {string} conversationId */
export async function resolveActiveHandoff(conversationId) {
  await pool.query(
    `UPDATE ${TABLES.handoffs}
     SET status = 'resolved'
     WHERE conversation_id = $1 AND status = 'claimed'`,
    [conversationId],
  )
}

export async function cancelActiveHandoffs(conversationId) {
  await pool.query(
    `UPDATE ${TABLES.handoffs}
     SET status = 'resolved'
     WHERE conversation_id = $1 AND status = ANY($2::text[])`,
    [conversationId, ACTIVE_HANDOFF_STATUSES],
  )
}
