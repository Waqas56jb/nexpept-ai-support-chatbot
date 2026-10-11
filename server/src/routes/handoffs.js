import { Router } from 'express'
import { pool, TABLES } from '../db.js'
import { mapHandoff, mapConversation } from '../utils/transform.js'
import { badRequest, getAgentId } from '../utils/http.js'
import { claimHandoffById } from '../services/handoffService.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const { rows: handoffs } = await pool.query(
      `SELECT * FROM ${TABLES.handoffs} ORDER BY requested_at DESC`,
    )

    const list = await Promise.all(
      handoffs.map(async (h) => {
        const { rows: convRows } = await pool.query(
          `SELECT * FROM ${TABLES.conversations} WHERE id = $1`,
          [h.conversation_id],
        )
        const convRow = convRows[0]
        return {
          ...mapHandoff(h),
          conversation: convRow ? mapConversation(convRow, h.id) : null,
        }
      }),
    )

    res.json(list)
  } catch (err) {
    next(err)
  }
})

router.post('/:id/claim', async (req, res, next) => {
  try {
    const agentId = req.body?.agentId || getAgentId(req)
    if (!agentId) throw badRequest('agentId is required')
    const result = await claimHandoffById(req.params.id, agentId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
