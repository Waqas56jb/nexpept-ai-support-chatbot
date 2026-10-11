import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { updateAgent } from '../services/agentService.js'
import { useWorkspace } from '../context/WorkspaceContext.jsx'

export default function AccountSettingsPage() {
  const { user } = useAuth()
  const { toast } = useWorkspace()
  const [name, setName] = useState('')
  const [status, setStatus] = useState('online')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setStatus(user.status || 'online')
    }
  }, [user])

  if (!user) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const patch = { name, status }
      if (password.trim()) patch.password = password.trim()
      await updateAgent(user.id, patch)
      toast.success('Account updated')
      setPassword('')
    } catch (err) {
      toast.error(err?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="page-card" style={{ padding: 16, maxWidth: 480 }} onSubmit={handleSubmit}>
      <h2 className="section-title">Your profile</h2>
      <p style={{ fontSize: 14, color: 'var(--np-muted)', marginTop: 0 }}>{user.email}</p>
      <div className="field">
        <label htmlFor="acc-name">Display name</label>
        <input
          id="acc-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="acc-status">Presence</label>
        <select
          id="acc-status"
          className="select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="online">Online</option>
          <option value="away">Away</option>
          <option value="offline">Offline</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="acc-pass">New password (optional)</label>
        <input
          id="acc-pass"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <button type="submit" className="btn" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
