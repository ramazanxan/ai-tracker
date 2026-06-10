import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './store/AppContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import AILabeling from './pages/AILabeling'
import CalendarPage from './pages/CalendarPage'
import ClickUpPage from './pages/ClickUpPage'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="labeling" element={<AILabeling />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="tasks" element={<ClickUpPage />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}
