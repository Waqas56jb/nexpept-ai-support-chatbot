import { Bell, LogOut, Menu } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useEffect, useState } from 'react'
import { getUnreadNotificationCount } from '../../services/notificationService.js'
import { useWorkspace } from '../../context/WorkspaceContext.jsx'

export default function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { tick } = useWorkspace()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    getUnreadNotificationCount().then(setUnread)
  }, [tick])

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="admin-topbar">
      <div className="admin-topbar__left">
        <button
          type="button"
          className="icon-btn mobile-menu-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <h1 className="admin-topbar__title">{title}</h1>
      </div>
      <div className="admin-topbar__actions">
        <Link to="/notifications" className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
          {unread > 0 ? <span className="dot" /> : null}
        </Link>
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="avatar" />
        ) : (
          <span className="avatar">{initials}</span>
        )}
        <button type="button" className="btn secondary" onClick={handleLogout}>
          <LogOut size={16} />
          <span className="signout-label">Sign out</span>
        </button>
      </div>
    </header>
  )
}
