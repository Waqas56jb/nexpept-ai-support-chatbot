import { AuthProvider } from '../context/AuthContext.jsx'
import { WorkspaceProvider } from '../context/WorkspaceContext.jsx'

export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <WorkspaceProvider>{children}</WorkspaceProvider>
    </AuthProvider>
  )
}
