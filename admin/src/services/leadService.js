import { apiFetch, USE_MOCK } from './apiClient.js'
import * as store from '../data/mockStore.js'

export async function listLeads() {
  if (USE_MOCK) return store.listLeads()
  return apiFetch('/leads')
}

export async function getLead(id) {
  if (USE_MOCK) return store.getLead(id)
  return apiFetch(`/leads/${encodeURIComponent(id)}`)
}
