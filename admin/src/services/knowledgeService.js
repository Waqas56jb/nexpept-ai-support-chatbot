import { apiFetch, buildQuery, USE_MOCK } from './apiClient.js'
import * as store from '../data/mockStore.js'
import { emit } from './events.js'

export async function listKnowledge(filters = {}) {
  if (USE_MOCK) return store.listKnowledge(filters)

  const query = buildQuery({
    type: filters.type,
    search: filters.search,
    status: filters.status,
    published:
      filters.published === true
        ? 'true'
        : filters.published === false
          ? 'false'
          : undefined,
  })
  return apiFetch(`/knowledge${query}`)
}

export async function createKnowledge(data) {
  if (USE_MOCK) return store.createKnowledge(data)

  const result = await apiFetch('/knowledge', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  emit()
  return result
}

export async function updateKnowledge(id, patch) {
  if (USE_MOCK) return store.updateKnowledge(id, patch)

  const result = await apiFetch(`/knowledge/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  emit()
  return result
}

export async function deleteKnowledge(id) {
  if (USE_MOCK) return store.deleteKnowledge(id)

  const result = await apiFetch(`/knowledge/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  emit()
  return result
}
