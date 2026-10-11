import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { createAgent, listAgents, updateAgent } from '../services/agentService.js'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { AGENT_ROLES } from '../utils/constants.js'

export default function AgentsPage() {
  const { tick, toast } = useWorkspace()
  const [agents, setAgents] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'changeme',
    role: 'agent',
    status: 'offline',
  })

  useEffect(() => {
    listAgents().then(setAgents)
  }, [tick])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await createAgent(form)
      toast.success('Agent created')
      setModal(false)
      setForm({ name: '', email: '', password: 'changeme', role: 'agent', status: 'offline' })
      setAgents(await listAgents())
    } catch (err) {
      toast.error(err?.message || 'Could not create agent')
    }
  }

  async function toggleStatus(agent) {
    const next = agent.status === 'online' ? 'away' : 'online'
    await updateAgent(agent.id, { status: next })
    setAgents(await listAgents())
  }

  return (
    <>
      <div className="page-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            Team agents
          </h2>
          <button type="button" className="btn" onClick={() => setModal(true)}>
            <Plus size={16} />
            Add agent
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {a.avatar ? <img src={a.avatar} alt="" className="avatar" /> : null}
                      {a.name}
                    </div>
                  </td>
                  <td>{a.email}</td>
                  <td>{a.role}</td>
                  <td>
                    <span className={`badge ${a.status === 'online' ? 'published' : 'draft'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="btn secondary" onClick={() => toggleStatus(a)}>
                      Toggle status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal ? (
        <div className="modal-backdrop" onClick={() => setModal(false)} role="presentation">
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <h2 className="modal__title">New agent</h2>
            <form onSubmit={handleCreate}>
              <div className="field">
                <label htmlFor="ag-name">Name</label>
                <input
                  id="ag-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="ag-email">Email</label>
                <input
                  id="ag-email"
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="ag-pass">Temporary password</label>
                <input
                  id="ag-pass"
                  className="input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="ag-role">Role</label>
                <select
                  id="ag-role"
                  className="select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {AGENT_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal__actions">
                <button type="button" className="btn secondary" onClick={() => setModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
