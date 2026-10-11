import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool, TABLES } from '../db.js'
import { mapAgent } from '../utils/transform.js'
import { badRequest, unauthorized, notFound } from '../utils/http.js'

const router = Router()

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase()
    const password = String(req.body?.password || '')

    if (!email || !password) throw badRequest('Email and password are required')

    const { rows } = await pool.query(
      `SELECT * FROM ${TABLES.agents} WHERE lower(email) = $1 LIMIT 1`,
      [email],
    )
    const agent = rows[0]
    if (!agent) throw unauthorized('Invalid email or password')

    const ok = await bcrypt.compare(password, agent.password_hash)
    if (!ok) throw unauthorized('Invalid email or password')

    res.json({ user: mapAgent(agent) })
  } catch (err) {
    next(err)
  }
})

router.get('/me', async (req, res, next) => {
  try {
    const agentId = req.headers['x-agent-id']
    if (typeof agentId !== 'string' || !agentId.trim()) {
      return res.json({ user: null })
    }

    const { rows } = await pool.query(
      `SELECT * FROM ${TABLES.agents} WHERE id = $1`,
      [agentId.trim()],
    )
    if (!rows.length) throw notFound('Agent not found')
    res.json({ user: mapAgent(rows[0]) })
  } catch (err) {
    next(err)
  }
})

export default router
