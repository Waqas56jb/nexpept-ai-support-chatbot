import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getDashboardSummary } from '../services/dashboardService.js'
import { listHandoffs } from '../services/conversationService.js'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { relativeTime } from '../utils/formatDate.js'
import { CHANNEL_LABELS, STATUS_LABELS } from '../utils/constants.js'

export default function DashboardPage() {
  const { tick } = useWorkspace()
  const [summary, setSummary] = useState(null)
  const [handoffs, setHandoffs] = useState([])

  useEffect(() => {
    getDashboardSummary().then(setSummary)
    listHandoffs().then(setHandoffs)
  }, [tick])

  if (!summary) return <p>Loading dashboard…</p>

  const chartData = Object.entries(summary.byChannel || {}).map(([channel, count]) => ({
    channel: CHANNEL_LABELS[channel] || channel,
    count,
  }))

  const pending = handoffs.filter((h) => h.status === 'pending').slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-card__label">Open conversations</p>
          <p className="stat-card__value">{summary.totals.openConversations}</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Pending handoffs</p>
          <p className="stat-card__value">{summary.totals.pendingHandoffs}</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">New leads</p>
          <p className="stat-card__value">{summary.totals.newLeads}</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Unread notifications</p>
          <p className="stat-card__value">{summary.totals.unreadNotifications}</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="page-card" style={{ padding: 16 }}>
          <h2 className="section-title">Conversations by channel</h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--np-navy)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="page-card" style={{ padding: 16 }}>
          <h2 className="section-title">Pending handoffs</h2>
          {pending.length === 0 ? (
            <p className="empty-state">No pending handoffs</p>
          ) : (
            pending.map((h) => (
              <div key={h.id} className="list-row">
                <div>
                  <strong>{h.conversation?.customerName || 'Customer'}</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--np-muted)', fontSize: 13 }}>
                    {h.reason}
                  </p>
                </div>
                <Link to={`/conversations?id=${h.conversationId}`} className="btn secondary">
                  Open
                </Link>
              </div>
            ))
          )}
          <Link to="/handoffs" className="btn ghost" style={{ marginTop: 8 }}>
            View all handoffs
          </Link>
        </div>
      </div>

      <div className="page-card" style={{ padding: 16 }}>
        <h2 className="section-title">Recent conversations</h2>
        {summary.recentActivity.map((c) => (
          <div key={c.id} className="list-row">
            <div>
              <strong>{c.customerName}</strong>
              <span style={{ marginLeft: 8 }} className={`badge ${c.status}`}>
                {STATUS_LABELS[c.status] || c.status}
              </span>
              <p style={{ margin: '4px 0 0', color: 'var(--np-muted)', fontSize: 13 }}>
                {c.subject}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--np-muted)' }}>
                {relativeTime(c.lastMessageAt)}
              </div>
              <Link to={`/conversations?id=${c.id}`} className="btn secondary" style={{ marginTop: 6 }}>
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
