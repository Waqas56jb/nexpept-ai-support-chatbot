import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../services/settingsService.js'
import { useWorkspace } from '../context/WorkspaceContext.jsx'

export default function ChatbotSettingsPage() {
  const { tick, toast } = useWorkspace()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSettings().then(setForm)
  }, [tick])

  if (!form) return <p>Loading settings…</p>

  function patch(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateSettings(form)
      toast.success('Chatbot settings saved')
    } catch (err) {
      toast.error(err?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid-2">
      <form className="page-card" style={{ padding: 16 }} onSubmit={handleSubmit}>
        <h2 className="section-title">Widget appearance</h2>
        <div className="field">
          <label htmlFor="brandName">Brand name</label>
          <input
            id="brandName"
            className="input"
            value={form.brandName}
            onChange={(e) => patch('brandName', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="headerTitle">Header title</label>
          <input
            id="headerTitle"
            className="input"
            value={form.headerTitle}
            onChange={(e) => patch('headerTitle', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="greeting">Greeting</label>
          <textarea
            id="greeting"
            className="textarea"
            value={form.greeting}
            onChange={(e) => patch('greeting', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="agentName">Agent display name</label>
          <input
            id="agentName"
            className="input"
            value={form.agentName}
            onChange={(e) => patch('agentName', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="agentAvatar">Agent avatar URL</label>
          <input
            id="agentAvatar"
            className="input"
            value={form.agentAvatar}
            onChange={(e) => patch('agentAvatar', e.target.value)}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={form.aiEnabledDefault}
            onChange={(e) => patch('aiEnabledDefault', e.target.checked)}
          />
          AI enabled by default for new chats
        </label>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>

      <div className="page-card" style={{ padding: 16 }}>
        <h2 className="section-title">Live preview</h2>
        <div className="preview-widget">
          <div style={{ fontSize: 12, opacity: 0.8 }}>{form.brandName}</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>{form.headerTitle}</div>
          <div className="preview-widget__card">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              {form.agentAvatar ? (
                <img src={form.agentAvatar} alt="" className="avatar" />
              ) : (
                <span className="avatar">NP</span>
              )}
              <div>
                <strong>{form.agentName}</strong>
                <div style={{ fontSize: 12, color: 'var(--np-muted)' }}>Typically replies in minutes</div>
              </div>
            </div>
            <div
              style={{
                background: '#f0f3f7',
                borderRadius: 12,
                padding: 10,
                fontSize: 14,
                marginBottom: 10,
              }}
            >
              {form.greeting}
            </div>
            <input className="input" placeholder="Type a message…" disabled />
          </div>
        </div>
      </div>
    </div>
  )
}
