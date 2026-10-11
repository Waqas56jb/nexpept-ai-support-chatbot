import { apiFetch, ADMIN_USER_STORAGE_KEY, USE_MOCK } from './apiClient.js'
import * as store from '../data/mockStore.js'

export async function getDashboardSummary() {
  if (USE_MOCK) return store.getDashboardSummary()
  return apiFetch('/dashboard/summary')
}

export async function getState() {
  if (USE_MOCK) return store.getState()

  let currentUser = null
  try {
    const raw = localStorage.getItem(ADMIN_USER_STORAGE_KEY)
    if (raw) currentUser = JSON.parse(raw)
  } catch {
    currentUser = null
  }
  return { currentUser }
}
