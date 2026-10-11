import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  createKnowledge,
  deleteKnowledge,
  listKnowledge,
  updateKnowledge,
} from '../services/knowledgeService.js'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { KNOWLEDGE_TYPES } from '../utils/constants.js'
import { formatDateTime } from '../utils/formatDate.js'

const emptyForm = {
  type: 'faq',
  title: '',
  body: '',
  tags: '',
  published: true,
}

export default function KnowledgePage() {
  const { tick, toast } = useWorkspace()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    listKnowledge(search ? { search } : {}).then(setItems)
  }, [tick, search])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(item) {
    setEditingId(item.id)
    setForm({
      type: item.type,
      title: item.title,
      body: item.body,
      tags: (item.tags || []).join(', '),
      published: item.published,
    })
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    const payload = {
      type: form.type,
      title: form.title,
      body: form.body,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      published: form.published,
    }
    try {
      if (editingId) {
        await updateKnowledge(editingId, payload)
        toast.success('Article updated')
      } else {
        await createKnowledge(payload)
        toast.success('Article created')
      }
      setModalOpen(false)
      setItems(await listKnowledge(search ? { search } : {}))
    } catch (err) {
      toast.error(err?.message || 'Save failed')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this knowledge item?')) return
    try {
      await deleteKnowledge(id)
      toast.success('Deleted')
      setItems(await listKnowledge(search ? { search } : {}))
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  return (
    <>
      <div className="page-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <input
            className="input"
            style={{ maxWidth: 320 }}
            placeholder="Search knowledge…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="btn" onClick={openCreate}>
            <Plus size={16} />
            Add article
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.type}</td>
                  <td>
                    <span className={`badge ${item.published ? 'published' : 'draft'}`}>
                      {item.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{formatDateTime(item.updatedAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn ghost" onClick={() => openEdit(item)}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" className="btn ghost" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)} role="presentation">
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <h2 className="modal__title">{editingId ? 'Edit article' : 'New article'}</h2>
            <form onSubmit={handleSave}>
              <div className="field">
                <label htmlFor="kb-type">Type</label>
                <select
                  id="kb-type"
                  className="select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {KNOWLEDGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="kb-title">Title</label>
                <input
                  id="kb-title"
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="kb-body">Body</label>
                <textarea
                  id="kb-body"
                  className="textarea"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="kb-tags">Tags (comma-separated)</label>
                <input
                  id="kb-tags"
                  className="input"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                Published
              </label>
              <div className="modal__actions">
                <button type="button" className="btn secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
