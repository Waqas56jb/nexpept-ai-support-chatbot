import { Router } from 'express'
import { pool, TABLES } from '../db.js'
import { mapNotification } from '../utils/transform.js'
import { notFound } from '../utils/http.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ${TABLES.notifications} ORDER BY created_at DESC`,
    )
    res.json(rows.map(mapNotification))
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE ${TABLES.notifications}
       SET read_at = coalesce(read_at, now())
       WHERE id = $1
       RETURNING *`,
      [req.params.id],
    )
    if (!rows.length) throw notFound('Notification not found')
    res.json(mapNotification(rows[0]))
  } catch (err) {
    next(err)
  }
})

router.post('/read-all', async (_req, res, next) => {
  try {
    await pool.query(
      `UPDATE ${TABLES.notifications} SET read_at = now() WHERE read_at IS NULL`,
    )
    const { rows } = await pool.query(
      `SELECT * FROM ${TABLES.notifications} ORDER BY created_at DESC`,
    )
    res.json(rows.map(mapNotification))
  } catch (err) {
    next(err)
  }
})

export default router
