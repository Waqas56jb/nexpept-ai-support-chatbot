import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

const TITLES = {
  '/': 'Dashboard',
  '/conversations': 'Conversations',
  '/handoffs': 'Handoffs',
  '/leads': 'Leads',
  '/notifications': 'Notifications',
  '/knowledge': 'Knowledge base',
  '/chatbot-settings': 'Chatbot settings',
  '/channels': 'Channels',
  '/agents': 'Agents',
  '/account': 'Account settings',
}

const SIDEBAR_KEY = 'nexpept_admin_sidebar_collapsed'

function pageTitle(pathname) {
  if (TITLES[pathname]) return TITLES[pathname]
  return 'NexPept Admin'
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })
  const fullBleed = pathname.startsWith('/conversations')

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  function toggleCollapsed() {
    setCollapsed((v) => !v)
  }

  return (
    <div className={`admin-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onClose={() => setMobileOpen(false)}
        onToggleCollapse={toggleCollapsed}
      />
      {mobileOpen ? (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <div className="admin-main">
        <Topbar
          title={pageTitle(pathname)}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className={`admin-content${fullBleed ? ' is-inbox' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
