import { useCallback, useState } from 'react'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'default') => {
      const id = ++toastId
      setToasts((prev) => [...prev, { id, message, type }])
      window.setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  const toast = {
    show: push,
    success: (message) => push(message, 'success'),
    error: (message) => push(message, 'error'),
  }

  return { toasts, dismiss, toast }
}
