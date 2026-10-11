import { pool, TABLES } from '../db.js'
import { mapConversation, mapMessage } from '../utils/transform.js'
import { findActiveHandoff } from './handoffService.js'

export async function attachHandoffIds(conversations) {
  return Promise.all(
    conversations.map(async (row) => {
      const handoff = await findActiveHandoff(row.id)
      return mapConversation(row, handoff?.id ?? null)
    }),
  )
}

export async function listMessages(conversationId, { publicOnly = false } = {}) {
  const visibilityClause = publicOnly ? `AND visibility = 'public'` : ''
  const { rows } = await pool.query(
    `SELECT * FROM ${TABLES.messages}
     WHERE conversation_id = $1 ${visibilityClause}
     ORDER BY created_at ASC`,
    [conversationId],
  )
  return rows.map(mapMessage)
}

export async function insertMessage({
  conversationId,
  senderType,
  senderId = null,
  content,
  visibility = 'public',
  aiGenerated = false,
}) {
  const trimmed = String(content || '').trim()
  if (!trimmed) return null

  const { rows } = await pool.query(
    `INSERT INTO ${TABLES.messages}
     (conversation_id, sender_type, sender_id, content, visibility, ai_generated)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [conversationId, senderType, senderId, trimmed, visibility, aiGenerated],
  )

  const msg = rows[0]
  const preview = trimmed.length > 500 ? `${trimmed.slice(0, 497)}...` : trimmed

  let unreadDelta = 0
  if (senderType === 'customer') unreadDelta = 1
  if (senderType === 'agent' && visibility === 'public') {
    /* agent public reply — customer may poll; keep unread for admin on customer msgs only */
  }

  await pool.query(
    `UPDATE ${TABLES.conversations}
     SET last_message = $2,
         last_message_at = now(),
         updated_at = now(),
         unread_count = CASE WHEN $3 > 0 THEN unread_count + $3 ELSE unread_count END,
         status = CASE
           WHEN status = 'open' AND $4 = 'customer' THEN 'ai_handling'
           ELSE status
         END
     WHERE id = $1`,
    [conversationId, preview, unreadDelta, senderType],
  )

  return mapMessage(msg)
}
