import { apiFetch, USE_MOCK } from './apiClient.js'
import * as store from '../data/mockStore.js'
import { emit } from './events.js'

export async function getChannels() {
  if (USE_MOCK) return store.getChannels()
  return apiFetch('/channels')
}

export async function updateChannel(channel, patch) {
  if (USE_MOCK) return store.updateChannel(channel, patch)

  const result = await apiFetch(`/channels/${encodeURIComponent(channel)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  emit()
  return result
}
