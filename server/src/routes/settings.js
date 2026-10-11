import { Router } from 'express'
import { pool, TABLES } from '../db.js'
import { settingsRowToApi } from '../utils/transform.js'
import { notFound } from '../utils/http.js'

const router = Router()

async function getSettingsRow() {
  const { rows } = await pool.query(`SELECT * FROM ${TABLES.settings} ORDER BY updated_at DESC LIMIT 1`)
  return rows[0] || null
}

router.get('/chatbot', async (_req, res, next) => {
  try {
    const row = await getSettingsRow()
    if (!row) {
      return res.json(settingsRowToApi({}))
    }
    res.json(settingsRowToApi(row))
  } catch (err) {
    next(err)
  }
})

router.patch('/chatbot', async (req, res, next) => {
  try {
    const body = req.body || {}
    let row = await getSettingsRow()

    const themePatch = { ...(row?.theme || {}) }
    if (body.brandName !== undefined) themePatch.brandName = body.brandName
    if (body.aiEnabledDefault !== undefined) themePatch.aiEnabledDefault = body.aiEnabledDefault
    if (body.widgetEnabled !== undefined) themePatch.widgetEnabled = Boolean(body.widgetEnabled)
    if (body.businessHours !== undefined) themePatch.businessHours = body.businessHours
    if (body.connectionStatus !== undefined) themePatch.connectionStatus = body.connectionStatus
    if (body.whatsappUrl !== undefined) themePatch.whatsappUrl = body.whatsappUrl
    if (body.instagramUrl !== undefined) themePatch.instagramUrl = body.instagramUrl

    let channels = Array.isArray(row?.channels) ? [...row.channels] : []
    if (body.whatsappUrl !== undefined) {
      const idx = channels.findIndex((c) => c.type === 'whatsapp')
      if (idx >= 0) channels[idx] = { ...channels[idx], url: body.whatsappUrl }
      else
        channels.push({
          type: 'whatsapp',
          label: 'WhatsApp',
          enabled: true,
          url: body.whatsappUrl,
          connectionStatus: 'link_only',
        })
    }
    if (body.instagramUrl !== undefined) {
      const idx = channels.findIndex((c) => c.type === 'instagram')
      if (idx >= 0) channels[idx] = { ...channels[idx], url: body.instagramUrl }
      else
        channels.push({
          type: 'instagram',
          label: 'Instagram',
          enabled: true,
          url: body.instagramUrl,
          connectionStatus: 'link_only',
        })
    }

    const fields = {
      workspace_name: body.brandName ?? row?.workspace_name,
      greeting: body.greeting ?? row?.greeting,
      team_name: body.agentName ?? row?.team_name,
      header_title: body.headerTitle ?? row?.header_title,
      avatar_url: body.agentAvatar ?? row?.avatar_url,
      show_faqs: body.showFaqs ?? row?.show_faqs,
      enable_human_handoff: body.enableHumanHandoff ?? row?.enable_human_handoff,
      theme: themePatch,
      channels,
    }

    if (!row) {
      const { rows } = await pool.query(
        `INSERT INTO ${TABLES.settings}
         (workspace_name, greeting, team_name, header_title, avatar_url, show_faqs, enable_human_handoff, theme, channels)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
         RETURNING *`,
        [
          fields.workspace_name || 'NexPept',
          fields.greeting,
          fields.team_name,
          fields.header_title,
          fields.avatar_url,
          fields.show_faqs !== false,
          fields.enable_human_handoff !== false,
          JSON.stringify(fields.theme),
          JSON.stringify(fields.channels),
        ],
      )
      row = rows[0]
    } else {
      const { rows } = await pool.query(
        `UPDATE ${TABLES.settings}
         SET workspace_name = coalesce($2, workspace_name),
             greeting = coalesce($3, greeting),
             team_name = coalesce($4, team_name),
             header_title = coalesce($5, header_title),
             avatar_url = coalesce($6, avatar_url),
             show_faqs = coalesce($7, show_faqs),
             enable_human_handoff = coalesce($8, enable_human_handoff),
             theme = $9::jsonb,
             channels = $10::jsonb,
             updated_at = now()
         WHERE id = $1
         RETURNING *`,
        [
          row.id,
          fields.workspace_name,
          fields.greeting,
          fields.team_name,
          fields.header_title,
          fields.avatar_url,
          fields.show_faqs,
          fields.enable_human_handoff,
          JSON.stringify(fields.theme),
          JSON.stringify(fields.channels),
        ],
      )
      if (!rows.length) throw notFound('Settings not found')
      row = rows[0]
    }

    res.json(settingsRowToApi(row))
  } catch (err) {
    next(err)
  }
})

export default router
