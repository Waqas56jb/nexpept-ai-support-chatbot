import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../services/settingsService.js'
import { useWorkspace } from '../context/WorkspaceContext.jsx'

export default function ChatbotSettingsPage() {
  const { tick, toast } = useWorkspace()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    getSettings().then(setForm)
  }, [tick])

  if (!form) return <p>Loading settings…</p>

  function patch(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleWidgetToggle() {
    if (toggling) return
    const currentlyOn = form.widgetEnabled !== false
    const next = !currentlyOn
    setToggling(true)
    setForm((prev) => ({ ...prev, widgetEnabled: next }))
    try {
      const updated = await updateSettings({ widgetEnabled: next })
      const savedOn = updated?.widgetEnabled !== false
      setForm((prev) => ({ ...prev, ...updated, widgetEnabled: savedOn }))
      toast.success(
        savedOn
          ? 'Chatbot is ON — visible on the website'
          : 'Chatbot is OFF — hidden from the website',
      )
    } catch (err) {
      setForm((prev) => ({ ...prev, widgetEnabled: currentlyOn }))
      toast.error(err?.message || 'Could not update chatbot visibility')
    } finally {
      setToggling(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateSettings(form)
      setForm(updated)
      toast.success('Chatbot settings saved')
    } catch (err) {
      toast.error(err?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const isOn = form.widgetEnabled !== false

  return (
    <div className="grid-2">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="page-card widget-power-card">
          <div className="widget-power-card__text">
            <h2 className="section-title" style={{ marginBottom: 4 }}>
              Website chatbot
            </h2>
            <p className="widget-power-card__hint">
              {isOn
                ? 'Live on the website — visitors can open the chat widget.'
                : 'Hidden from the website — the chat widget will not appear.'}
            </p>
          </div>
          <button
            type="button"
            className={`np-switch ${isOn ? 'is-on' : ''}`}
            role="switch"
            aria-checked={isOn}
            aria-label={isOn ? 'Turn chatbot off' : 'Turn chatbot on'}
            disabled={toggling}
            onClick={handleWidgetToggle}
          >
            <span className="np-switch__track">
              <span className="np-switch__thumb" />
            </span>
            <span className="np-switch__label">{isOn ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="page-card" style={{ padding: 16 }}>
          <h2 className="section-title">WordPress / website embed</h2>
          <p className="widget-power-card__hint" style={{ marginBottom: 12, maxWidth: 'none' }}>
            Paste this script before <code>&lt;/body&gt;</code> (Appearance → Theme File Editor →
            footer.php, or a custom HTML block / WPCode snippet).
          </p>
          <pre className="embed-code" tabIndex={0}>
            {`<script src="https://nexpept-ai-support-chatbot-mu.vercel.app/embed.js" async></script>`}
          </pre>
          <button
            type="button"
            className="btn secondary"
            style={{ marginTop: 10 }}
            onClick={async () => {
              const code =
                '<script src="https://nexpept-ai-support-chatbot-mu.vercel.app/embed.js" async></script>'
              try {
                await navigator.clipboard.writeText(code)
                toast.success('Embed script copied')
              } catch {
                toast.error('Copy failed — select the code manually')
              }
            }}
          >
            Copy embed script
          </button>
        </div>

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
              value={form.agentAvatar || ''}
              onChange={(e) => patch('agentAvatar', e.target.value)}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={form.aiEnabledDefault !== false}
              onChange={(e) => patch('aiEnabledDefault', e.target.checked)}
            />
            AI enabled by default for new chats
          </label>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      </div>

      <div className="page-card" style={{ padding: 16 }}>
        <h2 className="section-title">Live preview</h2>
        {!isOn ? (
          <div className="widget-preview-off">
            <img src="/logo.png" alt="" width={48} height={48} />
            <strong>Chatbot is OFF</strong>
            <p>Visitors will not see the widget on the website until you turn it on.</p>
          </div>
        ) : (
          <div className="preview-widget">
            <div style={{ fontSize: 12, opacity: 0.8 }}>{form.brandName}</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>{form.headerTitle}</div>
            <div className="preview-widget__card">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <img
                  src="/logo.png"
                  alt=""
                  className="avatar"
                  style={{ objectFit: 'contain', background: '#fff' }}
                />
                <div>
                  <strong>{form.agentName}</strong>
                  <div style={{ fontSize: 12, color: 'var(--np-muted)' }}>
                    Typically replies in minutes
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: 'var(--np-brand-soft, #e8f1fc)',
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
        )}
      </div>
    </div>
  )
}
