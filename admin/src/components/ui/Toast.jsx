import { X } from 'lucide-react'

export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div className="app-toast-wrap" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`app-toast${t.type !== 'default' ? ` ${t.type}` : ''}`}
        >
          <span className="app-toast__msg">{t.message}</span>
          <button
            type="button"
            className="app-toast__close"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>
      ))}
    </div>
  )
}
