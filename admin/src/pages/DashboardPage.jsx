import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getDashboardSummary } from '../services/dashboardService.js'
import { listHandoffs } from '../services/conversationService.js'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { relativeTime } from '../utils/formatDate.js'
import { STATUS_LABELS } from '../utils/constants.js'

const STATUS_COLORS = {
  open: '#0A5ACF',
  ai_handling: '#1a6de0',
  handoff_pending: '#b7791f',
  assigned: '#0d9488',
  waiting_for_customer: '#6366f1',
  resolved: '#18845b',
}

const AI_HUMAN_COLORS = ['#0A5ACF', '#94a3b8']

function formatDay(value) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return String(value)
  }
}

export default function DashboardPage() {
  const { tick } = useWorkspace()
  const [summary, setSummary] = useState(null)
  const [handoffs, setHandoffs] = useState([])

  useEffect(() => {
    getDashboardSummary().then(setSummary)
    listHandoffs().then(setHandoffs)
  }, [tick])

  const statusData = useMemo(() => {
    if (!summary?.byStatus) return []
    return Object.entries(summary.byStatus)
      .map(([status, count]) => ({
        status,
        name: STATUS_LABELS[status] || status,
        value: count,
        color: STATUS_COLORS[status] || '#64748b',
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [summary])

  const volumeData = useMemo(() => {
    const rows = summary?.volumeLast7Days || []
    return rows.map((r) => ({
      date: r.date,
      label: formatDay(r.date),
      count: r.count,
    }))
  }, [summary])

  const aiHumanData = useMemo(() => {
    const ai = summary?.aiVsHuman?.ai ?? 0
    const human = summary?.aiVsHuman?.human ?? 0
    return [
      { name: 'AI handling', value: ai },
      { name: 'Human / handoff', value: human },
    ].filter((d) => d.value > 0)
  }, [summary])

  if (!summary) return <p>Loading dashboard…</p>

  const pending = handoffs.filter((h) => h.status === 'pending').slice(0, 5)
  const statusTotal = statusData.reduce((sum, d) => sum + d.value, 0)

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

      <div className="dash-charts">
        <div className="page-card dash-chart-card">
          <h2 className="section-title">Status mix</h2>
          <p className="dash-chart-card__sub">How conversations are distributed right now</p>
          {statusData.length === 0 ? (
            <p className="empty-state">No conversation data yet</p>
          ) : (
            <div className="dash-pie-wrap">
              <div className="dash-pie-chart">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.status} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value}`, name]}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #e2e8f2',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dash-pie-center">
                  <strong>{statusTotal}</strong>
                  <span>total</span>
                </div>
              </div>
              <ul className="dash-legend">
                {statusData.map((d) => (
                  <li key={d.status}>
                    <span className="dash-legend__dot" style={{ background: d.color }} />
                    <span className="dash-legend__name">{d.name}</span>
                    <span className="dash-legend__value">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="page-card dash-chart-card">
          <h2 className="section-title">Volume · last 7 days</h2>
          <p className="dash-chart-card__sub">New conversations started each day</p>
          {volumeData.length === 0 ? (
            <p className="empty-state">No volume in the last 7 days</p>
          ) : (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <AreaChart data={volumeData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="npVolumeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0A5ACF" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0A5ACF" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eef6" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#667085' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#667085' }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.label || ''}
                    formatter={(value) => [`${value} chats`, 'Started']}
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #e2e8f2',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0A5ACF"
                    strokeWidth={2.5}
                    fill="url(#npVolumeFill)"
                    dot={{ r: 3, fill: '#0A5ACF', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {aiHumanData.length > 0 && (
            <div className="dash-ai-strip">
              {aiHumanData.map((d, i) => (
                <div key={d.name} className="dash-ai-strip__item">
                  <span
                    className="dash-legend__dot"
                    style={{ background: AI_HUMAN_COLORS[i % AI_HUMAN_COLORS.length] }}
                  />
                  <span>
                    {d.name}: <strong>{d.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
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

        <div className="page-card" style={{ padding: 16 }}>
          <h2 className="section-title">Recent conversations</h2>
          {(summary.recentActivity || []).length === 0 ? (
            <p className="empty-state">No conversations yet</p>
          ) : (
            summary.recentActivity.map((c) => (
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
                  <Link
                    to={`/conversations?id=${c.id}`}
                    className="btn secondary"
                    style={{ marginTop: 6 }}
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
