import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { getLead, listLeads } from '../services/leadService.js'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { formatDateTime } from '../utils/formatDate.js'
import { CHANNEL_LABELS } from '../utils/constants.js'

function leadsToCsv(rows) {
  const headers = ['id', 'name', 'email', 'phone', 'country', 'source', 'status', 'tags', 'createdAt']
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [headers.join(',')]
  rows.forEach((r) => {
    lines.push(
      [
        r.id,
        r.name,
        r.email,
        r.phone || '',
        r.country,
        r.source,
        r.status,
        (r.tags || []).join('|'),
        r.createdAt,
      ]
        .map(escape)
        .join(','),
    )
  })
  return lines.join('\n')
}

export default function LeadsPage() {
  const { tick } = useWorkspace()
  const [leads, setLeads] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    listLeads().then(setLeads)
  }, [tick])

  useEffect(() => {
    if (!selected) {
      setDetail(null)
      return
    }
    getLead(selected).then(setDetail).catch(() => setDetail(null))
  }, [selected])

  function exportCsv() {
    const blob = new Blob([leadsToCsv(leads)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexpept-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="page-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            Leads
          </h2>
          <button type="button" className="btn secondary" onClick={exportCsv}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Source</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr
                  key={l.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(l.id)}
                >
                  <td>{l.name}</td>
                  <td>{l.email}</td>
                  <td>{CHANNEL_LABELS[l.source] || l.source}</td>
                  <td>
                    <span className={`badge ${l.status === 'new' ? 'open' : 'assigned'}`}>{l.status}</span>
                  </td>
                  <td>{formatDateTime(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail ? (
        <div className="modal-backdrop" onClick={() => setSelected(null)} role="presentation">
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2 className="modal__title">{detail.name}</h2>
            <p style={{ margin: '0 0 8px' }}>{detail.email}</p>
            {detail.phone ? <p style={{ margin: '0 0 8px' }}>{detail.phone}</p> : null}
            <p style={{ fontSize: 13, color: 'var(--np-muted)' }}>
              {detail.country} · {CHANNEL_LABELS[detail.source] || detail.source}
            </p>
            <span className={`badge ${detail.status === 'new' ? 'open' : 'assigned'}`}>
              {detail.status}
            </span>
            {detail.tags?.length ? (
              <div className="filters-row" style={{ marginTop: 12 }}>
                {detail.tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
            {detail.notes ? (
              <p style={{ marginTop: 12, fontSize: 14 }}>{detail.notes}</p>
            ) : null}
            <div className="modal__actions">
              <button type="button" className="btn secondary" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
