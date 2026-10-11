const envBase = import.meta.env.VITE_API_BASE_URL
const API_BASE_URL =
  typeof envBase === 'string' && envBase.length > 0 ? envBase.replace(/\/$/, '') : ''

async function chatFetch(path, init = {}) {
  const url = `${API_BASE_URL}${path}`
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, { ...init, headers })
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

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
  return chatFetch(`/chat/${encodeURIComponent(conversationId)}/messages`)
}

export async function getFaqs() {
  return chatFetch('/chat/faqs')
}

export async function getChatSettings() {
  return chatFetch('/chat/settings')
}

/** @param {{ id: string, senderType?: string, content?: string }} msg */
export function mapApiMessageToUi(msg) {
  const sender = msg.senderType
  let role = 'bot'
  if (sender === 'customer') role = 'user'
  else if (sender === 'agent') role = 'bot'
  return {
    id: msg.id,
    role,
    text: msg.content,
  }
}
