/** @param {string} key */
function snakeToCamel(key) {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

/** @param {Record<string, unknown>} row */
export function rowToCamel(row) {
  if (!row || typeof row !== 'object') return row
  /** @type {Record<string, unknown>} */
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    out[snakeToCamel(k)] = v
  }
  return out
}

/** @param {Record<string, unknown>[]} rows */
export function rowsToCamel(rows) {
  return rows.map((r) => rowToCamel(r))
}

export function agentStatusToApi(dbStatus) {
  if (dbStatus === 'active') return 'online'
  if (dbStatus === 'inactive') return 'offline'
  return dbStatus
}

export function agentStatusToDb(apiStatus) {
  if (apiStatus === 'online' || apiStatus === 'away') return 'active'
  if (apiStatus === 'offline') return 'inactive'
  return apiStatus === 'inactive' ? 'inactive' : 'active'
}

/** @param {Record<string, unknown>} row */
export function mapAgent(row) {
  const c = rowToCamel(row)
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    role: c.role,
    status: agentStatusToApi(String(c.status || 'active')),
    avatar: c.avatarUrl ?? null,
    avatarUrl: c.avatarUrl ?? null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

/** @param {Record<string, unknown>} row */
export function mapLead(row) {
  const c = rowToCamel(row)
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    source: c.source,
    status: c.status,
    notes: c.notes,
    conversationCount: c.conversationCount ?? 0,
    tags: c.tags ?? [],
    createdAt: c.createdAt,
    lastSeenAt: c.lastSeenAt,
    updatedAt: c.updatedAt,
  }
}

/** @param {Record<string, unknown>} row */
export function mapConversation(row, handoffId = null) {
  const c = rowToCamel(row)
  return {
    id: c.id,
    channel: c.channel,
    status: c.status,
    subject: c.subject,
    customerName: c.customerName,
    customerEmail: c.customerEmail,
    customerPhone: c.customerPhone,
    customerHandle: c.customerHandle,
    leadId: c.leadId,
    assignedAgentId: c.assignedAgentId,
    aiEnabled: c.aiEnabled,
    handoffId,
    priority: c.priority,
    lastMessage: c.lastMessage,
    unreadCount: c.unreadCount ?? 0,
    tags: c.tags ?? [],
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    lastMessageAt: c.lastMessageAt,
    handoffRequestedAt: c.handoffRequestedAt,
    resolvedAt: c.status === 'resolved' ? c.updatedAt : undefined,
  }
}

/** @param {Record<string, unknown>} row */
export function mapMessage(row) {
  const c = rowToCamel(row)
  return {
    id: c.id,
    conversationId: c.conversationId,
    senderType: c.senderType,
    senderId: c.senderId,
    content: c.content,
    messageType: c.messageType,
    visibility: c.visibility,
    aiGenerated: c.aiGenerated,
    deliveryStatus: c.deliveryStatus,
    createdAt: c.createdAt,
  }
}

/** @param {Record<string, unknown>} row */
export function mapHandoff(row) {
  const c = rowToCamel(row)
  return {
    id: c.id,
    conversationId: c.conversationId,
    status: c.status,
    reason: c.reason,
    requestedAt: c.requestedAt,
    claimedAt: c.claimedAt,
    claimedBy: c.claimedBy,
    priority: c.priority,
  }
}

/** @param {Record<string, unknown>} row */
export function mapKnowledge(row) {
  const c = rowToCamel(row)
  const body = c.answer || c.content || c.summary || ''
  return {
    id: c.id,
    type: c.type,
    title: c.title || c.question || '',
    body,
    question: c.question,
    answer: c.answer,
    category: c.category,
    status: c.status,
    published: c.status === 'published',
    tags: c.tags ?? [],
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

/** @param {Record<string, unknown>} row */
export function mapNotification(row) {
  const c = rowToCamel(row)
  return {
    id: c.id,
    type: c.type,
    title: c.title,
    body: c.body,
    conversationId: c.conversationId,
    recipientAgentId: c.recipientAgentId,
    read: Boolean(c.readAt),
    readAt: c.readAt,
    createdAt: c.createdAt,
  }
}

/** @param {Record<string, unknown>} row */
export function settingsRowToApi(row) {
  const c = rowToCamel(row)
  const theme = typeof c.theme === 'object' && c.theme ? c.theme : {}
  const channels = Array.isArray(c.channels) ? c.channels : []

  const whatsapp = channels.find((ch) => ch.type === 'whatsapp')
  const instagram = channels.find((ch) => ch.type === 'instagram')

  return {
    brandName: theme.brandName || c.workspaceName || 'NexPept',
    greeting: c.greeting || 'Hey! How can we assist you today?',
    headerTitle: c.headerTitle || 'Our team is here for you',
    agentName: c.teamName || 'NexPept Support',
    agentAvatar: c.avatarUrl || theme.agentAvatar || null,
    whatsappUrl: whatsapp?.url || theme.whatsappUrl || '',
    instagramUrl: instagram?.url || theme.instagramUrl || '',
    connectionStatus: theme.connectionStatus || whatsapp?.connectionStatus || 'link_only',
    aiEnabledDefault: theme.aiEnabledDefault !== false,
    /** When false, website chatbot widget is hidden */
    widgetEnabled: theme.widgetEnabled !== false,
    showFaqs: c.showFaqs !== false,
    enableHumanHandoff: c.enableHumanHandoff !== false,
    businessHours: theme.businessHours || {
      timezone: 'America/Toronto',
      start: '09:00',
      end: '17:00',
    },
    onlineStatus: c.onlineStatus,
    theme,
    channels,
  }
}
