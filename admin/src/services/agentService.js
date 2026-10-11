import { apiFetch, USE_MOCK } from './apiClient.js'
import * as store from '../data/mockStore.js'
import { emit } from './events.js'

export async function listAgents() {
  if (USE_MOCK) return store.listAgents()
  return apiFetch('/agents')
}

export async function createAgent(data) {
  if (USE_MOCK) return store.createAgent(data)

  const result = await apiFetch('/agents', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  emit()
  return result
}

export async function updateAgent(id, patch) {
  if (USE_MOCK) return store.updateAgent(id, patch)

  const result = await apiFetch(`/agents/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  emit()
  return result
}
