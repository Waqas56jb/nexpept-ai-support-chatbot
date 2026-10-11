import { apiFetch, USE_MOCK } from './apiClient.js'
import * as store from '../data/mockStore.js'
import { emit } from './events.js'

export async function listNotifications() {
  if (USE_MOCK) return store.listNotifications()
  return apiFetch('/notifications')
}

export async function markNotificationRead(id) {
  if (USE_MOCK) return store.markNotificationRead(id)

  const result = await apiFetch(`/notifications/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  })
  emit()
  return result
}

export async function markAllNotificationsRead() {
  if (USE_MOCK) return store.markAllNotificationsRead()

  const result = await apiFetch('/notifications/read-all', {
    method: 'POST',
    body: JSON.stringify({}),
  })
  emit()
  return result
}

export async function getUnreadNotificationCount() {
  if (USE_MOCK) return store.getUnreadNotificationCount()

  const list = await listNotifications()
  return list.filter((n) => !n.read).length
}
