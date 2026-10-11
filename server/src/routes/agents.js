import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool, TABLES } from '../db.js'
import { mapAgent, agentStatusToDb } from '../utils/transform.js'
import { badRequest, conflict, notFound } from '../utils/http.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, status, avatar_url, created_at, updated_at
       FROM ${TABLES.agents}
       ORDER BY created_at ASC`,
    )
    res.json(rows.map(mapAgent))
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase()
    if (!email) throw badRequest('Email is required')

    const { rows: existing } = await pool.query(
      `SELECT id FROM ${TABLES.agents} WHERE lower(email) = $1`,
      [email],
    )
    if (existing.length) throw conflict('Agent with this email already exists')

    const password = String(req.body?.password || 'changeme')
    const hash = await bcrypt.hash(password, 10)
    const status = agentStatusToDb(req.body?.status || 'offline')

    const { rows } = await pool.query(
      `INSERT INTO ${TABLES.agents} (name, email, password_hash, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, status, avatar_url, created_at, updated_at`,
      [
        String(req.body?.name || '').trim() || email.split('@')[0],
        email,
        hash,
        req.body?.role === 'admin' ? 'admin' : 'agent',
        status,
        req.body?.avatar || req.body?.avatarUrl || null,
      ],
    )
    res.status(201).json(mapAgent(rows[0]))
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const body = req.body || {}
    const sets = []
    const params = [req.params.id]

    if (body.name !== undefined) {
      params.push(String(body.name).trim())
      sets.push(`name = $${params.length}`)
    }
    if (body.email !== undefined) {
      params.push(String(body.email).trim().toLowerCase())
      sets.push(`email = $${params.length}`)
    }
    if (body.role !== undefined) {
      params.push(body.role === 'admin' ? 'admin' : 'agent')
      sets.push(`role = $${params.length}`)
    }
    if (body.status !== undefined) {
      params.push(agentStatusToDb(body.status))
      sets.push(`status = $${params.length}`)
    }
    if (body.avatar !== undefined || body.avatarUrl !== undefined) {
      params.push(body.avatar ?? body.avatarUrl)
      sets.push(`avatar_url = $${params.length}`)
    }
    if (body.password) {
      const hash = await bcrypt.hash(String(body.password), 10)
      params.push(hash)
      sets.push(`password_hash = $${params.length}`)
    }

    if (!sets.length) throw badRequest('No valid fields to update')
    sets.push('updated_at = now()')

    const { rows } = await pool.query(
      `UPDATE ${TABLES.agents} SET ${sets.join(', ')}
       WHERE id = $1
       RETURNING id, name, email, role, status, avatar_url, created_at, updated_at`,
      params,
    )
    if (!rows.length) throw notFound('Agent not found')
    res.json(mapAgent(rows[0]))
  } catch (err) {
    next(err)
  }
})

export default router
