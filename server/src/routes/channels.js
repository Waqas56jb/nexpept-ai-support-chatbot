import { Router } from 'express'
import { pool, TABLES } from '../db.js'
import { notFound } from '../utils/http.js'

const router = Router()

async function loadChannels() {
  const { rows } = await pool.query(
    `SELECT channels FROM ${TABLES.settings} ORDER BY updated_at DESC LIMIT 1`,
  )
  const channels = rows[0]?.channels
  return Array.isArray(channels) ? channels : []
}

router.get('/', async (_req, res, next) => {
  try {
    const channels = await loadChannels()
    res.json(channels.map((c) => ({ ...c })))
  } catch (err) {
    next(err)
  }
})

router.patch('/:channel', async (req, res, next) => {
  try {
    const channelType = req.params.channel
    const { rows: settingsRows } = await pool.query(
      `SELECT id, channels FROM ${TABLES.settings} ORDER BY updated_at DESC LIMIT 1`,
    )
    if (!settingsRows.length) throw notFound('Settings not found')

    const settings = settingsRows[0]
    const channels = Array.isArray(settings.channels) ? [...settings.channels] : []
    const idx = channels.findIndex((c) => c.type === channelType)
    if (idx === -1) throw notFound('Channel not found')

    channels[idx] = {
      ...channels[idx],
      ...req.body,
      type: channelType,
      updatedAt: new Date().toISOString(),
    }

    await pool.query(
      `UPDATE ${TABLES.settings} SET channels = $2::jsonb, updated_at = now() WHERE id = $1`,
      [settings.id, JSON.stringify(channels)],
    )

    res.json({ ...channels[idx] })
  } catch (err) {
    next(err)
  }
})

export default router
