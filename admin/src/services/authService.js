import { apiFetch, ADMIN_USER_STORAGE_KEY, USE_MOCK } from './apiClient.js'
import * as store from '../data/mockStore.js'
import { emit, subscribe as subscribeEvents } from './events.js'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(ADMIN_USER_STORAGE_KEY)
    if (!raw) return null
    const user = JSON.parse(raw)
    return user && typeof user === 'object' ? user : null
  } catch {
    return null
  }
}

function writeStoredUser(user) {
  if (!user) {
    localStorage.removeItem(ADMIN_USER_STORAGE_KEY)
    return
  }
  localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(user))
}

export async function login(email, password) {
  if (USE_MOCK) {
    return store.login(email, password)
  }

  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  const user = data?.user ?? null
  if (!user) throw new Error('Invalid login response')
  writeStoredUser(user)
  emit()
  return user
}

export async function logout() {
  if (USE_MOCK) {
    store.logout()
    return null
  }
  writeStoredUser(null)
  emit()
  return null
}

export async function getCurrentUser() {
  if (USE_MOCK) {
    return store.getCurrentUser()
  }

  const cached = readStoredUser()
  if (!cached?.id) return null

  try {
    const data = await apiFetch('/auth/me')
    const user = data?.user ?? null
    if (user) {
      writeStoredUser(user)
      return user
    }
    writeStoredUser(null)
    return null
  } catch {
    return cached
  }
}

export function subscribe(listener) {
  if (USE_MOCK) {
    return store.subscribe(listener)
  }
  const wrapped = () => {
    listener({ currentUser: readStoredUser() })
  }
  return subscribeEvents(wrapped)
}
