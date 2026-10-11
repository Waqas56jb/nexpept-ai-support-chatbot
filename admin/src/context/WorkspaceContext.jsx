import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { subscribe } from '../services/authService.js'
import { useToast } from '../hooks/useToast.js'
import ToastStack from '../components/ui/Toast.jsx'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const [tick, setTick] = useState(0)
  const { toasts, dismiss, toast } = useToast()

  useEffect(() => {
    return subscribe(() => {
      setTick((n) => n + 1)
    })
  }, [])

  const value = useMemo(() => ({ tick, toast }), [tick, toast])

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
