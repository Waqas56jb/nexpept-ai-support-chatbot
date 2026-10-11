import { Router } from 'express'
import { pool, TABLES } from '../db.js'
import { mapKnowledge } from '../utils/transform.js'
import { badRequest, notFound } from '../utils/http.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { type, search, published, status } = req.query
    const clauses = []
    const params = []

    if (type) {
      params.push(type)
      clauses.push(`type = $${params.length}`)
    }
    if (status) {
      params.push(status)
      clauses.push(`status = $${params.length}`)
    } else if (published === 'true' || published === true) {
      clauses.push(`status = 'published'`)
    } else if (published === 'false' || published === false) {
      clauses.push(`status = 'draft'`)
    }
    if (search) {
      params.push(`%${String(search).toLowerCase()}%`)
      clauses.push(
        `(lower(coalesce(title, '')) LIKE $${params.length} OR lower(coalesce(answer, content, '')) LIKE $${params.length})`,
      )
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const { rows } = await pool.query(
      `SELECT * FROM ${TABLES.knowledge} ${where} ORDER BY updated_at DESC`,
      params,
    )
    res.json(rows.map(mapKnowledge))
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {}
    const title = String(body.title || body.question || '').trim()
    const answer = String(body.body || body.answer || body.content || '').trim()
    if (!title) throw badRequest('Title is required')

    const published = body.published !== false && body.status !== 'draft'
    const status = published ? 'published' : 'draft'

    const { rows } = await pool.query(
      `INSERT INTO ${TABLES.knowledge}
       (type, title, question, answer, content, status, tags, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        body.type || 'faq',
        title,
        body.question || title,
        answer,
        answer,
        status,
        Array.isArray(body.tags) ? body.tags : [],
        body.category || null,
      ],
    )
    res.status(201).json(mapKnowledge(rows[0]))
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const body = req.body || {}
    const sets = []
    const params = [req.params.id]

    const map = {
      type: 'type',
      title: 'title',
      question: 'question',
      category: 'category',
      tags: 'tags',
    }

    for (const [key, col] of Object.entries(map)) {
      if (body[key] !== undefined) {
        params.push(body[key])
        sets.push(`${col} = $${params.length}`)
      }
    }

    if (body.body !== undefined || body.answer !== undefined || body.content !== undefined) {
      const text = String(body.body ?? body.answer ?? body.content ?? '').trim()
      params.push(text)
      sets.push(`answer = $${params.length}`)
      params.push(text)
      sets.push(`content = $${params.length}`)
    }

    if (body.published !== undefined) {
      params.push(body.published ? 'published' : 'draft')
      sets.push(`status = $${params.length}`)
    } else if (body.status !== undefined) {
      params.push(body.status)
      sets.push(`status = $${params.length}`)
    }

    if (!sets.length) throw badRequest('No valid fields to update')
    sets.push('updated_at = now()')

    const { rows } = await pool.query(
      `UPDATE ${TABLES.knowledge} SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
      params,
    )
    if (!rows.length) throw notFound('Knowledge item not found')
    res.json(mapKnowledge(rows[0]))
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM ${TABLES.knowledge} WHERE id = $1 RETURNING *`,
      [req.params.id],
    )
    if (!rows.length) throw notFound('Knowledge item not found')
    res.json(mapKnowledge(rows[0]))
  } catch (err) {
    next(err)
  }
})

export default router
