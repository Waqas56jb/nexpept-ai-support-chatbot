import { apiFetch, USE_MOCK } from './apiClient.js'
import * as store from '../data/mockStore.js'
import { emit } from './events.js'

export async function getSettings() {
  if (USE_MOCK) return store.getSettings()
  return apiFetch('/settings/chatbot')
}

export async function updateSettings(patch) {
  if (USE_MOCK) return store.updateSettings(patch)

  const result = await apiFetch('/settings/chatbot', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  emit()
  return result
}
