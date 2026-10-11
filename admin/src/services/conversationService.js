import { apiFetch, buildQuery, USE_MOCK } from './apiClient.js'
import * as store from '../data/mockStore.js'
import { emit } from './events.js'

export async function listConversations(filters = {}) {
  if (USE_MOCK) return store.listConversations(filters)

  const query = buildQuery({
    status: filters.status,
    channel: filters.channel,
    search: filters.search,
    assignedTo: filters.assignedTo ?? filters.assignedAgentId,
  })
  return apiFetch(`/conversations${query}`)
}

export async function getConversation(id) {
  if (USE_MOCK) return store.getConversation(id)
  return apiFetch(`/conversations/${encodeURIComponent(id)}`)
}

export async function getMessages(conversationId) {
  if (USE_MOCK) return store.getMessages(conversationId)
  return apiFetch(`/conversations/${encodeURIComponent(conversationId)}/messages`)
}

export async function sendMessage(conversationId, payload) {
  if (USE_MOCK) {
    const result = store.sendMessage(conversationId, payload)
    return result
  }

  const result = await apiFetch(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        content: payload?.content,
        senderType: payload?.senderType ?? 'agent',
        visibility: payload?.visibility ?? 'public',
      }),
    },
  )
  emit()
  return result
}

export async function updateConversation(id, patch) {
  if (USE_MOCK) return store.updateConversation(id, patch)

  const { unreadCount: _unread, ...apiPatch } = patch || {}
  if (!Object.keys(apiPatch).length) {
    if (_unread !== undefined) return getConversation(id)
    return getConversation(id)
  }

  const result = await apiFetch(`/conversations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(apiPatch),
  })
  emit()
  return result
}

export async function claimHandoff(id, agentId) {
  if (USE_MOCK) return store.claimHandoff(id, agentId)

  const result = await apiFetch(`/handoffs/${encodeURIComponent(id)}/claim`, {
    method: 'POST',
    body: JSON.stringify({ agentId }),
  })
  emit()
  return result
}

export async function requestHandoff(conversationId, reason) {
  if (USE_MOCK) return store.requestHandoff(conversationId, reason)

  const result = await apiFetch(
    `/conversations/${encodeURIComponent(conversationId)}/handoff`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  )
  emit()
  return result
}

export async function resolveConversation(id) {
  if (USE_MOCK) return store.resolveConversation(id)

  const result = await apiFetch(`/conversations/${encodeURIComponent(id)}/resolve`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  emit()
  return result
}

export async function reopenConversation(id) {
  if (USE_MOCK) return store.reopenConversation(id)

  const result = await apiFetch(`/conversations/${encodeURIComponent(id)}/reopen`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  emit()
  return result
}

export async function returnToAI(id) {
  if (USE_MOCK) return store.returnToAI(id)

  const result = await apiFetch(
    `/conversations/${encodeURIComponent(id)}/return-to-ai`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  )
  emit()
  return result
}

export async function listHandoffs() {
  if (USE_MOCK) return store.listHandoffs()
  return apiFetch('/handoffs')
}
