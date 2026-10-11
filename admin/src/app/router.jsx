import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import ConversationsPage from '../pages/ConversationsPage.jsx'
import HandoffsPage from '../pages/HandoffsPage.jsx'
import LeadsPage from '../pages/LeadsPage.jsx'
import KnowledgePage from '../pages/KnowledgePage.jsx'
import ChatbotSettingsPage from '../pages/ChatbotSettingsPage.jsx'
import ChannelsPage from '../pages/ChannelsPage.jsx'
import NotificationsPage from '../pages/NotificationsPage.jsx'
import AgentsPage from '../pages/AgentsPage.jsx'
import AccountSettingsPage from '../pages/AccountSettingsPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'

function ProtectedShell() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="login-page">
        <p>Loading…</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <AdminLayout />
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route element={<ProtectedShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="conversations" element={<ConversationsPage />} />
          <Route path="handoffs" element={<HandoffsPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="chatbot-settings" element={<ChatbotSettingsPage />} />
          <Route path="channels" element={<ChannelsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="account" element={<AccountSettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
