import { Router } from 'express'
import { pool, TABLES } from '../db.js'
import { mapLead } from '../utils/transform.js'
import { notFound } from '../utils/http.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ${TABLES.leads} ORDER BY created_at DESC`,
    )
    res.json(rows.map(mapLead))
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ${TABLES.leads} WHERE id = $1`,
      [req.params.id],
    )
    if (!rows.length) throw notFound('Lead not found')
    res.json(mapLead(rows[0]))
  } catch (err) {
    next(err)
  }
})

export default router
