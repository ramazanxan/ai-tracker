import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../store/AppContext'

const NAV = [
  { label: 'Main', items: [
    { to: '/dashboard', icon: '⚡', text: 'Dashboard' },
    { to: '/labeling', icon: '🤖', text: 'AI Labeling' },
    { to: '/calendar', icon: '📅', text: 'Calendar' },
  ]},
  { label: 'Manage', items: [
    { to: '/tasks', icon: '✅', text: 'Tasks' },
    { to: '/analytics', icon: '📊', text: 'Analytics' },
  ]},
  { label: 'System', items: [
    { to: '/settings', icon: '⚙️', text: 'Settings' },
  ]},
]

const PAGE_TITLES = {
  '/dashboard': ['Dashboard', 'Overview of all your work'],
  '/labeling': ['AI Labeling', 'Track your labeling tasks'],
  '/calendar': ['Calendar', 'View tasks by day'],
  '/tasks': ['ClickUp Tasks', 'Manage and sync your tasks'],
  '/analytics': ['Analytics', 'Progress charts and stats'],
  '/settings': ['Settings', 'Configure the app'],
}

export default function Layout() {
  const { state } = useApp()
  const location = useLocation()
  const [title, sub] = PAGE_TITLES[location.pathname] || ['Tracker', '']
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">⚡</div>
          <div>
            <div className="logo-name">WorkTracker</div>
            <div className="logo-tagline">Business Dashboard</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(section => (
            <div key={section.label}>
              <div className="nav-label">{section.label}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
                >
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item" style={{ fontSize: 12, color: 'var(--text-dim)', cursor: 'default' }}>
            <span>💾</span>
            <span>{state.entries.length} записей</span>
          </div>
        </div>
      </aside>

      <header className="topbar">
        <div>
          <div className="topbar-title">{title}</div>
          <div className="topbar-sub">{sub}</div>
        </div>
        <div className="topbar-chips">
          <div className="chip">
            <span className="chip-dot" />
            <span>Online</span>
          </div>
          <div className="chip">
            <span>📅</span>
            <span>{today}</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
