import { Router } from 'express'
import { pool, TABLES } from '../db.js'
import { attachHandoffIds } from '../services/conversationService.js'

const router = Router()

const OPEN_STATUSES = [
  'open',
  'ai_handling',
  'handoff_pending',
  'assigned',
  'waiting_for_customer',
]

router.get('/summary', async (_req, res, next) => {
  try {
    const [
      totalRes,
      openRes,
      pendingRes,
      resolvedRes,
      leadsRes,
      newLeadsRes,
      unreadNotifRes,
      knowledgeRes,
      byChannelRes,
      byStatusRes,
      volumeRes,
      aiHumanRes,
      recentRes,
    ] = await Promise.all([
      pool.query(`SELECT count(*)::int AS c FROM ${TABLES.conversations}`),
      pool.query(
        `SELECT count(*)::int AS c FROM ${TABLES.conversations} WHERE status = ANY($1::text[])`,
        [OPEN_STATUSES],
      ),
      pool.query(
        `SELECT count(*)::int AS c FROM ${TABLES.handoffs} WHERE status = 'pending'`,
      ),
      pool.query(
        `SELECT count(*)::int AS c FROM ${TABLES.conversations} WHERE status = 'resolved'`,
      ),
      pool.query(`SELECT count(*)::int AS c FROM ${TABLES.leads}`),
      pool.query(`SELECT count(*)::int AS c FROM ${TABLES.leads} WHERE status = 'new'`),
      pool.query(
        `SELECT count(*)::int AS c FROM ${TABLES.notifications} WHERE read_at IS NULL`,
      ),
      pool.query(`SELECT count(*)::int AS c FROM ${TABLES.knowledge}`),
      pool.query(
        `SELECT channel, count(*)::int AS count FROM ${TABLES.conversations} GROUP BY channel`,
      ),
      pool.query(
        `SELECT status, count(*)::int AS count FROM ${TABLES.conversations} GROUP BY status`,
      ),
      pool.query(
        `SELECT date_trunc('day', created_at)::date AS day, count(*)::int AS count
         FROM ${TABLES.conversations}
         WHERE created_at >= now() - interval '7 days'
         GROUP BY 1
         ORDER BY 1`,
      ),
      pool.query(
        `SELECT
           sum(CASE WHEN ai_enabled = true THEN 1 ELSE 0 END)::int AS ai,
           sum(CASE WHEN ai_enabled = false THEN 1 ELSE 0 END)::int AS human
         FROM ${TABLES.conversations}
         WHERE status = ANY($1::text[])`,
        [OPEN_STATUSES],
      ),
      pool.query(
        `SELECT * FROM ${TABLES.conversations}
         ORDER BY coalesce(last_message_at, created_at) DESC
         LIMIT 5`,
      ),
    ])

    const byChannel = Object.fromEntries(
      byChannelRes.rows.map((r) => [r.channel, r.count]),
    )
    const byStatus = Object.fromEntries(
      byStatusRes.rows.map((r) => [r.status, r.count]),
    )

    const volumeLast7Days = volumeRes.rows.map((r) => ({
      date: r.day,
      count: r.count,
    }))

    const aiVsHuman = {
      ai: aiHumanRes.rows[0]?.ai ?? 0,
      human: aiHumanRes.rows[0]?.human ?? 0,
    }

    const recentActivity = await attachHandoffIds(recentRes.rows)

    res.json({
      totalConversations: totalRes.rows[0].c,
      openConversations: openRes.rows[0].c,
      pendingHandoffs: pendingRes.rows[0].c,
      resolvedConversations: resolvedRes.rows[0].c,
      volumeLast7Days,
      aiVsHuman,
      totals: {
        conversations: totalRes.rows[0].c,
        openConversations: openRes.rows[0].c,
        pendingHandoffs: pendingRes.rows[0].c,
        leads: leadsRes.rows[0].c,
        newLeads: newLeadsRes.rows[0].c,
        unreadNotifications: unreadNotifRes.rows[0].c,
        knowledgeArticles: knowledgeRes.rows[0].c,
      },
      byChannel,
      byStatus,
      recentActivity,
    })
  } catch (err) {
    next(err)
  }
})

export default router
