import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { claimHandoff, listHandoffs } from '../services/conversationService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { formatDateTime } from '../utils/formatDate.js'
import { CHANNEL_LABELS } from '../utils/constants.js'

export default function HandoffsPage() {
  const { user } = useAuth()
  const { tick, toast } = useWorkspace()
  const [handoffs, setHandoffs] = useState([])
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    listHandoffs().then(setHandoffs)
  }, [tick])

  const filtered = handoffs.filter((h) => (filter === 'all' ? true : h.status === filter))

  async function handleClaim(id) {
    if (!user) return
    try {
      await claimHandoff(id, user.id)
      toast.success('Handoff claimed')
      setHandoffs(await listHandoffs())
    } catch (err) {
      toast.error(err?.message || 'Claim failed')
    }
  }

  return (
    <div className="page-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Handoffs
        </h2>
        <div className="filters-row">
          {['pending', 'claimed', 'completed', 'all'].map((s) => (
            <button
              key={s}
              type="button"
              className={`chip${filter === s ? ' active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Channel</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Requested</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => (
              <tr key={h.id}>
                <td>{h.conversation?.customerName || '—'}</td>
                <td>{CHANNEL_LABELS[h.conversation?.channel] || '—'}</td>
                <td>{h.reason}</td>
                <td>
                  <span className={`badge ${h.status === 'pending' ? 'handoff_pending' : 'assigned'}`}>
                    {h.status}
                  </span>
                </td>
                <td>{formatDateTime(h.requestedAt)}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {h.status === 'pending' ? (
                    <button type="button" className="btn secondary" onClick={() => handleClaim(h.id)}>
                      Claim
                    </button>
                  ) : null}{' '}
                  <Link to={`/conversations?id=${h.conversationId}`} className="btn ghost">
                    Open chat
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? <p className="empty-state">No handoffs in this view</p> : null}
      </div>
    </div>
  )
}
