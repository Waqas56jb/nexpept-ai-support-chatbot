import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import conversationsRoutes from './routes/conversations.js'
import handoffsRoutes from './routes/handoffs.js'
import leadsRoutes from './routes/leads.js'
import knowledgeRoutes from './routes/knowledge.js'
import notificationsRoutes from './routes/notifications.js'
import agentsRoutes from './routes/agents.js'
import settingsRoutes from './routes/settings.js'
import channelsRoutes from './routes/channels.js'
import chatRoutes from './routes/chat.js'
import { HttpError } from './utils/http.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 4000

app.use(cors())
app.use(express.json({ limit: '1mb' }))

/** Chat polling must never be cached (browsers were getting 304 and wiping UI). */
app.use('/api/chat', (_req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    Expires: '0',
  })
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'nexpept-support-api', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/conversations', conversationsRoutes)
app.use('/api/handoffs', handoffsRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/agents', agentsRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/channels', channelsRoutes)
app.use('/api/chat', chatRoutes)

app.use((err, _req, res, _next) => {
  const status = err instanceof HttpError ? err.status : 500
  const message = err?.message || 'Internal server error'
  if (status >= 500) {
    console.error(err)
  }
  res.status(status).json({
    error: message,
    code: err instanceof HttpError ? err.code : 'INTERNAL',
  })
})

app.listen(port, () => {
  console.log(`NexPept API listening on http://localhost:${port}`)
})
