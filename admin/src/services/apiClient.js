/** Production API — hardcoded (no Vite .env required). */
export const API_BASE_URL =
  'https://nexpept-ai-support-chatbot-server-two.vercel.app/api'

export const APP_URLS = {
  admin: 'https://nexpept-ai-support-chatbot-admin-two.vercel.app',
  client: 'https://nexpept-ai-support-chatbot-mu.vercel.app',
  server: 'https://nexpept-ai-support-chatbot-server-two.vercel.app',
}

/** Always use the live API (mock store disabled). */
export const USE_MOCK = false

export const ADMIN_USER_STORAGE_KEY = 'nexpept_admin_user'

function agentIdFromStorage() {
  try {
    const raw = localStorage.getItem(ADMIN_USER_STORAGE_KEY)
    if (!raw) return null
    const user = JSON.parse(raw)
    return typeof user?.id === 'string' && user.id.trim() ? user.id.trim() : null
  } catch {
    return null
  }
}

/**
 * @param {string} path
 * @param {RequestInit} [init]
 */
export async function apiFetch(path, init = {}) {
  if (USE_MOCK) {
    throw new Error(
      'apiFetch called while USE_MOCK is enabled. Use service layer instead.',
    )
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const agentId = agentIdFromStorage()
  if (agentId && !headers.has('x-agent-id')) {
    headers.set('x-agent-id', agentId)
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

  if (isJson) {
    return response.json()
  }
  return response.text()
}

/** @param {Record<string, string | number | boolean | undefined | null>} params */
export function buildQuery(params) {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value))
    }
  }
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}
