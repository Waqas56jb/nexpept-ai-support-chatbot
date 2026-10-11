import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AtSign, Mail, Phone, Search, UserRound } from 'lucide-react'
import {
  claimHandoff,
  getConversation,
  getMessages,
  listConversations,
  listHandoffs,
  reopenConversation,
  requestHandoff,
  resolveConversation,
  returnToAI,
  sendMessage,
  updateConversation,
} from '../services/conversationService.js'
import { getLead } from '../services/leadService.js'
import { listAgents } from '../services/agentService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import {
  CHANNEL_LABELS,
  CONVERSATION_STATUSES,
  STATUS_LABELS,
} from '../utils/constants.js'
import { formatDateTime, relativeTime } from '../utils/formatDate.js'

const STATUS_FILTERS = ['all', ...CONVERSATION_STATUSES]

export default function ConversationsPage() {
  const { user } = useAuth()
  const { tick, toast } = useWorkspace()
  const [searchParams, setSearchParams] = useSearchParams()

  const [conversations, setConversations] = useState([])
  const [handoffs, setHandoffs] = useState([])
  const [agents, setAgents] = useState([])
  const [selectedId, setSelectedId] = useState(searchParams.get('id') || '')
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [lead, setLead] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [internalNote, setInternalNote] = useState(false)
  const [showInternal, setShowInternal] = useState(true)
  const [sending, setSending] = useState(false)
  const [mobilePane, setMobilePane] = useState('list')

  const loadList = useCallback(async () => {
    const filters = {}
    if (statusFilter !== 'all') filters.status = statusFilter
    if (channelFilter !== 'all') filters.channel = channelFilter
    if (search.trim()) filters.search = search.trim()
    const [convs, hs, ag] = await Promise.all([
      listConversations(filters),
      listHandoffs(),
      listAgents(),
    ])
    setConversations(convs)
    setHandoffs(hs)
    setAgents(ag)
  }, [statusFilter, channelFilter, search])

  const loadThread = useCallback(async (id) => {
    if (!id) {
      setConversation(null)
      setMessages([])
      setLead(null)
      return
    }
    const conv = await getConversation(id)
    setConversation(conv)
    const msgs = await getMessages(id)
    setMessages(msgs)
    if (conv.unreadCount) {
      await updateConversation(id, { unreadCount: 0 })
    }
    if (conv.leadId) {
      try {
        setLead(await getLead(conv.leadId))
      } catch {
        setLead(null)
      }
    } else {
      setLead(null)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList, tick])

  useEffect(() => {
    const fromUrl = searchParams.get('id')
    if (fromUrl && fromUrl !== selectedId) setSelectedId(fromUrl)
  }, [searchParams, selectedId])

  useEffect(() => {
    loadThread(selectedId)
  }, [selectedId, loadThread, tick])

  const activeHandoff = useMemo(() => {
    if (!conversation) return null
    return handoffs.find(
      (h) =>
        h.conversationId === conversation.id &&
        (h.status === 'pending' || h.status === 'claimed'),
    )
  }, [handoffs, conversation])

  function selectConversation(id) {
    setSelectedId(id)
    setSearchParams(id ? { id } : {})
    setMobilePane('thread')
  }

  async function handleSend(e) {
    e.preventDefault()
    const content = draft.trim()
    if (!content || !selectedId) return
    setSending(true)
    try {
      await sendMessage(selectedId, {
        content,
        senderType: 'agent',
        visibility: internalNote ? 'internal' : 'public',
      })
      const wasInternal = internalNote
      setDraft('')
      setInternalNote(false)
      await loadThread(selectedId)
      await loadList()
      toast.success(wasInternal ? 'Internal note added' : 'Reply sent')
    } catch (err) {
      toast.error(err?.message || 'Could not send message')
    } finally {
      setSending(false)
    }
  }

  async function handleClaim() {
    if (!activeHandoff || !user) return
    try {
      await claimHandoff(activeHandoff.id, user.id)
      toast.success('Handoff claimed')
      await loadThread(selectedId)
      await loadList()
    } catch (err) {
      toast.error(err?.message || 'Could not claim handoff')
    }
  }

  async function handleResolve() {
    if (!selectedId) return
    try {
      await resolveConversation(selectedId)
      toast.success('Conversation resolved')
      await loadThread(selectedId)
      await loadList()
    } catch (err) {
      toast.error(err?.message || 'Could not resolve')
    }
  }

  async function handleReopen() {
    if (!selectedId) return
    try {
      await reopenConversation(selectedId)
      toast.success('Conversation reopened')
      await loadThread(selectedId)
      await loadList()
    } catch (err) {
      toast.error(err?.message || 'Could not reopen')
    }
  }

  async function handleReturnToAI() {
    if (!selectedId) return
    try {
      await returnToAI(selectedId)
      toast.success('Returned to AI')
      await loadThread(selectedId)
      await loadList()
    } catch (err) {
      toast.error(err?.message || 'Could not return to AI')
    }
  }

  async function handleRequestHandoff() {
    if (!selectedId) return
    try {
      await requestHandoff(selectedId, 'Agent requested handoff from admin')
      toast.success('Handoff requested')
      await loadThread(selectedId)
      await loadList()
    } catch (err) {
      toast.error(err?.message || 'Could not request handoff')
    }
  }

  const visibleMessages = showInternal
    ? messages
    : messages.filter((m) => m.visibility !== 'internal')

  const assignedAgent = agents.find((a) => a.id === conversation?.assignedAgentId)

  return (
    <div className="inbox">
      <div className={`inbox-list${mobilePane !== 'list' ? ' hide-mobile' : ''}`}>
        <div className="inbox-toolbar">
          <div className="inbox-search">
            <Search size={15} className="inbox-search__icon" aria-hidden />
            <input
              className="inbox-search__input"
              placeholder="Search name, email, or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="inbox-filters">
            <label className="inbox-filter">
              <span className="inbox-filter__label">Status</span>
              <select
                className="inbox-filter__select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'All statuses' : STATUS_LABELS[s] || s}
                  </option>
                ))}
              </select>
            </label>

            <label className="inbox-filter">
              <span className="inbox-filter__label">Channel</span>
              <select
                className="inbox-filter__select"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
              >
                <option value="all">All channels</option>
                <option value="website">{CHANNEL_LABELS.website}</option>
                <option value="whatsapp">{CHANNEL_LABELS.whatsapp}</option>
                <option value="instagram">{CHANNEL_LABELS.instagram}</option>
              </select>
            </label>
          </div>

          <div className="inbox-toolbar__meta">
            <span>
              {conversations.length} conversation{conversations.length === 1 ? '' : 's'}
            </span>
            {(statusFilter !== 'all' || channelFilter !== 'all' || search.trim()) && (
              <button
                type="button"
                className="inbox-toolbar__clear"
                onClick={() => {
                  setStatusFilter('all')
                  setChannelFilter('all')
                  setSearch('')
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        <div className="inbox-list__scroll">
          {conversations.length === 0 ? (
            <p className="empty-state">No conversations match filters</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`conv-item${selectedId === c.id ? ' active' : ''}`}
                onClick={() => selectConversation(c.id)}
              >
                {c.unreadCount > 0 ? <span className="unread-dot" /> : <span style={{ width: 8 }} />}
                <div className="conv-item__meta">
                  <div className="conv-item__top">
                    <span className="conv-item__name">{c.customerName}</span>
                    <span className="conv-item__time">{relativeTime(c.lastMessageAt)}</span>
                  </div>
                  <p className="conv-item__preview">{c.subject}</p>
                  <span className={`badge ${c.status}`}>{STATUS_LABELS[c.status]}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div
        className={`inbox-thread${mobilePane !== 'thread' ? ' hide-mobile' : ''}${
          !conversation ? ' is-empty' : ''
        }`}
      >
        {!conversation ? (
          <p className="empty-state">Select a conversation</p>
        ) : (
          <>
            {conversation.status === 'handoff_pending' ? (
              <div className="banner">Handoff pending — claim to respond as agent.</div>
            ) : null}
            <div className="thread-header">
              <div style={{ minWidth: 0 }}>
                <strong style={{ fontSize: 14 }}>{conversation.subject}</strong>
                <div style={{ fontSize: 12, color: 'var(--np-muted)', marginTop: 2 }}>
                  {conversation.customerName} · {CHANNEL_LABELS[conversation.channel]}
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                <span className={`badge ${conversation.status}`}>
                  {STATUS_LABELS[conversation.status]}
                </span>
                {conversation.aiEnabled ? (
                  <span className="badge ai_handling">AI on</span>
                ) : (
                  <span className="badge draft">AI off</span>
                )}
              </div>
            </div>

            <div className="thread-messages">
              {visibleMessages.map((m) => {
                const cls = [
                  'msg',
                  m.senderType,
                  m.visibility === 'internal' ? 'internal' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <div key={m.id} className={cls}>
                    <div className="msg__meta">
                      <span>{m.senderType}</span>
                      {m.visibility === 'internal' ? <span>internal</span> : null}
                      <span>{formatDateTime(m.createdAt)}</span>
                    </div>
                    {m.content}
                  </div>
                )
              })}
            </div>

            <form className="thread-composer" onSubmit={handleSend}>
              <div className="filters-row">
                <button
                  type="button"
                  className={`chip${showInternal ? ' active' : ''}`}
                  onClick={() => setShowInternal((v) => !v)}
                >
                  {showInternal ? 'Hide notes' : 'Show notes'}
                </button>
                <button
                  type="button"
                  className={`chip${internalNote ? ' active' : ''}`}
                  onClick={() => setInternalNote((v) => !v)}
                >
                  Internal note
                </button>
              </div>
              <div className="composer-row">
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder={internalNote ? 'Add an internal note…' : 'Reply to customer…'}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      e.currentTarget.form?.requestSubmit()
                    }
                  }}
                />
                <button type="submit" className="btn" disabled={sending || !draft.trim()}>
                  Send
                </button>
              </div>
              <div className="composer-actions">
                {activeHandoff?.status === 'pending' ? (
                  <button type="button" className="btn" onClick={handleClaim}>
                    Claim handoff
                  </button>
                ) : null}
                {conversation.status !== 'resolved' ? (
                  <button type="button" className="btn secondary" onClick={handleResolve}>
                    Resolve
                  </button>
                ) : (
                  <button type="button" className="btn secondary" onClick={handleReopen}>
                    Reopen
                  </button>
                )}
                {!conversation.aiEnabled && conversation.status !== 'resolved' ? (
                  <button type="button" className="btn secondary" onClick={handleReturnToAI}>
                    Return to AI
                  </button>
                ) : null}
                {conversation.aiEnabled && !activeHandoff ? (
                  <button type="button" className="btn ghost" onClick={handleRequestHandoff}>
                    Request handoff
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn ghost mobile-menu-btn"
                  onClick={() => setMobilePane('list')}
                >
                  Back to list
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <aside className="inbox-aside">
        {conversation ? (
          <div className="detail-panel">
            <div className="detail-panel__header">
              <h3>Customer profile</h3>
              <span className={`badge ${conversation.status}`}>
                {STATUS_LABELS[conversation.status]}
              </span>
            </div>

            <div className="detail-card detail-card--profile">
              <div className="detail-avatar">
                {(conversation.customerName || '?')
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="detail-card__body">
                <strong className="detail-name">{conversation.customerName}</strong>
                <span className="detail-channel">
                  {CHANNEL_LABELS[conversation.channel] || conversation.channel}
                </span>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-card__title">Contact</div>
              {conversation.customerEmail ? (
                <div className="detail-row">
                  <Mail size={14} />
                  <span>{conversation.customerEmail}</span>
                </div>
              ) : null}
              {conversation.customerPhone ? (
                <div className="detail-row">
                  <Phone size={14} />
                  <span>{conversation.customerPhone}</span>
                </div>
              ) : null}
              {conversation.customerHandle ? (
                <div className="detail-row">
                  <AtSign size={14} />
                  <span>{conversation.customerHandle}</span>
                </div>
              ) : null}
              {!conversation.customerEmail &&
              !conversation.customerPhone &&
              !conversation.customerHandle ? (
                <p className="detail-muted">No contact details yet</p>
              ) : null}
            </div>

            <div className="detail-card">
              <div className="detail-card__title">Assignment</div>
              <div className="detail-row">
                <UserRound size={14} />
                <span>{assignedAgent ? assignedAgent.name : 'Unassigned'}</span>
              </div>
              <div className="detail-meta">
                <span>AI replies</span>
                <strong>{conversation.aiEnabled ? 'On' : 'Paused'}</strong>
              </div>
              {conversation.lastMessageAt ? (
                <div className="detail-meta">
                  <span>Last activity</span>
                  <strong>{relativeTime(conversation.lastMessageAt)}</strong>
                </div>
              ) : null}
            </div>

            {activeHandoff ? (
              <div className="detail-card detail-card--alert">
                <div className="detail-card__title">Human handoff</div>
                <p className="detail-text">{activeHandoff.reason}</p>
                <span
                  className={`badge ${
                    activeHandoff.status === 'pending' ? 'handoff_pending' : 'assigned'
                  }`}
                >
                  {activeHandoff.status}
                </span>
              </div>
            ) : null}

            {lead ? (
              <div className="detail-card">
                <div className="detail-card__title">Lead record</div>
                <strong className="detail-name detail-name--sm">{lead.name}</strong>
                <p className="detail-muted">{lead.email}</p>
                {lead.phone ? <p className="detail-muted">{lead.phone}</p> : null}
                <div className="detail-tags">
                  <span className={`badge ${lead.status || 'draft'}`}>
                    {lead.status || 'new'}
                  </span>
                </div>
                {lead.notes ? <p className="detail-text">{lead.notes}</p> : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="detail-empty">
            <UserRound size={22} />
            <p>Select a conversation to view customer details</p>
          </div>
        )}
      </aside>
    </div>
  )
}
