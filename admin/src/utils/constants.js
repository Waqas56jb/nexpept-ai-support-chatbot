/** Deployed app URLs (hardcoded — no .env). */
export const APP_URLS = {
  admin: 'https://nexpept-ai-support-chatbot-admin.vercel.app',
  client: 'https://nexpept-ai-support-chatbot.vercel.app',
  server: 'https://nexpept-ai-support-chatbot-server.vercel.app',
}

export const CONVERSATION_STATUSES = [
  'open',
  'ai_handling',
  'handoff_pending',
  'assigned',
  'waiting_for_customer',
  'resolved',
]

export const STATUS_LABELS = {
  open: 'Open',
  ai_handling: 'AI handling',
  handoff_pending: 'Handoff pending',
  assigned: 'Assigned',
  waiting_for_customer: 'Waiting for customer',
  resolved: 'Resolved',
}

export const CHANNEL_TYPES = ['website', 'whatsapp']

export const CHANNEL_LABELS = {
  website: 'Website chat',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram', // legacy rows only
}

export const MESSAGE_VISIBILITY = ['public', 'internal']

export const SENDER_TYPES = ['customer', 'agent', 'ai', 'system']

export const AGENT_ROLES = ['admin', 'agent']

export const KNOWLEDGE_TYPES = ['faq', 'article', 'sop']

export const NOTIFICATION_TYPES = [
  'handoff',
  'new_message',
  'lead',
  'system',
]

export const DEMO_LOGIN = {
  email: 'alex@nexpept.demo',
  password: 'Demo@123',
}

export const SETTINGS_STORAGE_KEY = 'nexpept_admin_settings'

export const ACTIVE_HANDOFF_STATUSES = ['handoff_pending', 'assigned']
