import { NavLink } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  Bot,
  LayoutDashboard,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  Settings,
  UserCog,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getUnreadNotificationCount } from '../../services/notificationService.js'
import { listConversations, listHandoffs } from '../../services/conversationService.js'
import { useWorkspace } from '../../context/WorkspaceContext.jsx'

const workspaceLinks = [
  { to: '/', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/conversations', label: 'Conversations', icon: MessageSquare, badgeKey: 'conversations' },
  { to: '/handoffs', label: 'Human Handoffs', icon: UserPlus, badgeKey: 'handoffs' },
  { to: '/leads', label: 'Customers & Leads', icon: Users },
]

const configLinks = [
  { to: '/knowledge', label: 'Knowledge Base & FAQs', icon: BookOpen },
  { to: '/chatbot-settings', label: 'Chatbot Settings', icon: Bot },
  { to: '/channels', label: 'Channels', icon: Radio },
  { to: '/notifications', label: 'Notifications', icon: Bell, badgeKey: 'notifications' },
  { to: '/agents', label: 'Team & Agents', icon: UserCog },
]

export default function Sidebar({ mobileOpen, collapsed, onClose, onToggleCollapse }) {
  const { tick } = useWorkspace()
  const [badges, setBadges] = useState({
    conversations: 0,
    handoffs: 0,
    notifications: 0,
  })

  useEffect(() => {
    let cancelled = false
    Promise.all([listConversations(), listHandoffs(), getUnreadNotificationCount()]).then(
      ([convs, handoffs, unread]) => {
        if (cancelled) return
        const unreadConvs = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
        const pendingHandoffs = handoffs.filter((h) => h.status === 'pending').length
        setBadges({
          conversations: unreadConvs,
          handoffs: pendingHandoffs,
          notifications: unread,
        })
      },
    )
    return () => {
      cancelled = true
    }
  }, [tick])

  const renderLink = (item) => {
    const Icon = item.icon
    const count = item.badgeKey ? badges[item.badgeKey] : 0
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
        onClick={onClose}
      >
        <span className="admin-nav-link__icon">
          <Icon size={18} strokeWidth={2} aria-hidden />
          {collapsed && count > 0 ? <span className="admin-nav-link__dot" /> : null}
        </span>
        <span className="admin-nav-link__label">{item.label}</span>
        {!collapsed && count > 0 ? (
          <span className="admin-nav-link__badge">{count > 99 ? '99+' : count}</span>
        ) : null}
      </NavLink>
    )
  }

  return (
    <aside
      className={`admin-sidebar${mobileOpen ? ' open' : ''}${collapsed ? ' is-collapsed' : ''}`}
    >
      <div className="admin-brand">
        <div className="admin-brand__mark">
          <img src="/logo.png" alt="NexPept" />
        </div>
        <div className="admin-brand__text">
          <span className="admin-brand__name">NexPept</span>
          <span className="admin-brand__sub">Admin workspace</span>
        </div>
        <button
          type="button"
          className="admin-sidebar__toggle desktop-only"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <button
          type="button"
          className="admin-sidebar__toggle mobile-only"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="admin-sidebar__nav">
        <div className="admin-nav-section">
          <span>Workspace</span>
        </div>
        {workspaceLinks.map(renderLink)}

        <div className="admin-nav-section">
          <span>AI &amp; configuration</span>
        </div>
        {configLinks.map(renderLink)}
      </div>

      <div className="admin-sidebar__footer">
        <NavLink
          to="/account"
          title={collapsed ? 'Account settings' : undefined}
          className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
          onClick={onClose}
        >
          <span className="admin-nav-link__icon">
            <Settings size={18} strokeWidth={2} aria-hidden />
          </span>
          <span className="admin-nav-link__label">Account settings</span>
        </NavLink>

        <button
          type="button"
          className="admin-sidebar__collapse-btn desktop-only"
          onClick={onToggleCollapse}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          <span className="admin-nav-link__label">
            {collapsed ? 'Open panel' : 'Close panel'}
          </span>
        </button>
      </div>
    </aside>
  )
}
