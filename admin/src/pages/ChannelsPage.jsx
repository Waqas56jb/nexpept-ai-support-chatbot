import { useEffect, useState } from 'react'
import { getChannels, updateChannel } from '../services/channelService.js'
import { useWorkspace } from '../context/WorkspaceContext.jsx'

const ALLOWED = ['whatsapp', 'instagram']

export default function ChannelsPage() {
  const { tick, toast } = useWorkspace()
  const [channels, setChannels] = useState([])

  useEffect(() => {
    getChannels().then((all) => setChannels(all.filter((c) => ALLOWED.includes(c.type))))
  }, [tick])

  async function save(channel) {
    try {
      await updateChannel(channel.type, {
        enabled: channel.enabled,
        url: channel.url,
        connectionStatus: channel.connectionStatus,
      })
      toast.success(`${channel.label} updated`)
      const all = await getChannels()
      setChannels(all.filter((c) => ALLOWED.includes(c.type)))
    } catch (err) {
      toast.error(err?.message || 'Update failed')
    }
  }

  return (
    <div className="grid-2">
      {channels.map((ch) => (
        <div key={ch.id} className="page-card" style={{ padding: 16 }}>
          <h2 className="section-title">{ch.label}</h2>
          <p style={{ fontSize: 13, color: 'var(--np-muted)' }}>
            Link-only mode opens the external app when visitors tap the channel button.
          </p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
            <input
              type="checkbox"
              checked={ch.enabled}
              onChange={(e) =>
                setChannels((prev) =>
                  prev.map((c) => (c.id === ch.id ? { ...c, enabled: e.target.checked } : c)),
                )
              }
            />
            Enabled on widget
          </label>
          <div className="field">
            <label htmlFor={`url-${ch.id}`}>Link URL</label>
            <input
              id={`url-${ch.id}`}
              className="input"
              value={ch.url || ''}
              onChange={(e) =>
                setChannels((prev) =>
                  prev.map((c) => (c.id === ch.id ? { ...c, url: e.target.value } : c)),
                )
              }
            />
          </div>
          <div className="field">
            <label htmlFor={`status-${ch.id}`}>Connection status</label>
            <select
              id={`status-${ch.id}`}
              className="select"
              value={ch.connectionStatus}
              onChange={(e) =>
                setChannels((prev) =>
                  prev.map((c) =>
                    c.id === ch.id ? { ...c, connectionStatus: e.target.value } : c,
                  ),
                )
              }
            >
              <option value="link_only">Link only</option>
              <option value="connected">Connected</option>
              <option value="disconnected">Disconnected</option>
            </select>
          </div>
          <button type="button" className="btn" onClick={() => save(channels.find((c) => c.id === ch.id))}>
            Save channel
          </button>
        </div>
      ))}
    </div>
  )
}
