import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService.js'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { relativeTime } from '../utils/formatDate.js'

export default function NotificationsPage() {
  const { tick, toast } = useWorkspace()
  const [items, setItems] = useState([])

  useEffect(() => {
    listNotifications().then(setItems)
  }, [tick])

  async function markRead(id) {
    await markNotificationRead(id)
    setItems(await listNotifications())
  }

  async function markAll() {
    await markAllNotificationsRead()
    toast.success('All notifications marked read')
    setItems(await listNotifications())
  }

  return (
    <div className="page-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Notifications
        </h2>
        <button type="button" className="btn secondary" onClick={markAll}>
          Mark all read
        </button>
      </div>
      {items.map((n) => (
        <div
          key={n.id}
          className="list-row"
          style={{ opacity: n.read ? 0.65 : 1, alignItems: 'center' }}
        >
          <div>
            <strong>{n.title}</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--np-muted)' }}>{n.body}</p>
            <span style={{ fontSize: 12, color: 'var(--np-muted)' }}>{relativeTime(n.createdAt)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {n.conversationId ? (
              <Link to={`/conversations?id=${n.conversationId}`} className="btn secondary">
                Open
              </Link>
            ) : null}
            {!n.read ? (
              <button type="button" className="btn ghost" onClick={() => markRead(n.id)}>
                Mark read
              </button>
            ) : null}
          </div>
        </div>
      ))}
      {items.length === 0 ? <p className="empty-state">No notifications</p> : null}
    </div>
  )
}
