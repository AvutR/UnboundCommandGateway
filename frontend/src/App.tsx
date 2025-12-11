import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Commands from './pages/Commands'
import CommandHistory from './pages/CommandHistory'
import AdminUsers from './pages/AdminUsers'
import AdminRules from './pages/AdminRules'
import AdminAuditLogs from './pages/AdminAuditLogs'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { apiKey } = useAuthStore()
  
  if (!apiKey) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="commands" element={<Commands />} />
          <Route path="history" element={<CommandHistory />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/rules" element={<AdminRules />} />
          <Route path="admin/audit-logs" element={<AdminAuditLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

