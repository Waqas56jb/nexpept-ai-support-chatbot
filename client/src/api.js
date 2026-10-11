/** Production API — hardcoded (no Vite .env required). */
export const API_BASE_URL =
  'https://nexpept-ai-support-chatbot-server.vercel.app/api'

export const APP_URLS = {
  admin: 'https://nexpept-ai-support-chatbot-admin.vercel.app',
  client: 'https://nexpept-ai-support-chatbot.vercel.app',
  server: 'https://nexpept-ai-support-chatbot-server.vercel.app',
}

async function chatFetch(path, init = {}) {
  const url = `${API_BASE_URL}${path}`
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Cache-Control', 'no-cache')
  headers.set('Pragma', 'no-cache')

  const controller = new AbortController()
  const timeoutMs = 45000
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      cache: 'no-store',
      signal: init.signal || controller.signal,
    })
    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')

    // 304 with empty body must never wipe chat state
    if (response.status === 304) {
      throw new Error('Stale cache response')
    }

    if (!response.ok) {
      if (isJson) {
        const data = await response.json().catch(() => ({}))
        const message =
          typeof data?.error === 'string' && data.error
            ? data.error
            : `Request failed (${response.status})`
        throw new Error(message)
      }
      const text = await response.text().catch(() => '')
      throw new Error(text || `Request failed (${response.status})`)
    }

    if (isJson) return response.json()
    return response.text()
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export async function startChat({ name, email, phone, countryCode }) {
  return chatFetch('/chat/start', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, countryCode }),
  })
}

export async function sendChatMessage(conversationId, content) {
  return chatFetch(`/chat/${encodeURIComponent(conversationId)}/message`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export async function requestHandoff(conversationId, reason) {
  return chatFetch(`/chat/${encodeURIComponent(conversationId)}/handoff`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function getChatMessages(conversationId) {
  const bust = `_=${Date.now()}`
  return chatFetch(
    `/chat/${encodeURIComponent(conversationId)}/messages?${bust}`,
  )
}

export async function getFaqs() {
  return chatFetch('/chat/faqs')
}

export async function getChatSettings() {
  // Cache-bust so admin ON/OFF is reflected quickly on the website
  return chatFetch(`/chat/settings?_=${Date.now()}`)
}

/** @param {{ id: string, senderType?: string, content?: string, createdAt?: string }} msg */
export function mapApiMessageToUi(msg) {
  const sender = msg.senderType
  let role = 'bot'
  if (sender === 'customer') role = 'user'
  else if (sender === 'agent') role = 'agent'
  else if (sender === 'ai') role = 'bot'
  return {
    id: msg.id,
    role,
    text: String(msg.content || ''),
    createdAt: msg.createdAt || null,
    senderType: sender || (role === 'user' ? 'customer' : 'ai'),
  }
}

/** Merge thread by id, preserving order (server order preferred when full list). */
export function mergeMessageLists(current, incoming) {
  const map = new Map()
  for (const m of current || []) {
    if (m?.id) map.set(m.id, m)
  }
  for (const m of incoming || []) {
    if (m?.id) map.set(m.id, m)
  }
  const pending = (current || []).filter((m) => String(m.id).startsWith('u-pending-'))
  const serverish = [...map.values()].filter((m) => !String(m.id).startsWith('u-pending-'))
  return [...serverish, ...pending]
}
