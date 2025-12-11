import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  Terminal, 
  History, 
  Users, 
  Shield, 
  LogOut, 
  Menu,
  X,
  FileText
} from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Terminal },
    { path: '/commands', label: 'Commands', icon: Terminal },
    { path: '/history', label: 'History', icon: History },
  ]

  if (user?.role === 'admin') {
    navItems.push(
      { path: '/admin/users', label: 'Users', icon: Users },
      { path: '/admin/rules', label: 'Rules', icon: Shield },
      { path: '/admin/audit-logs', label: 'Audit Logs', icon: FileText }
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-slate-800 border-r border-slate-700
          transform transition-transform duration-300 ease-in-out z-40
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-400 mb-8">
            Command Gateway
          </h1>
          
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive(item.path)
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-8 pt-8 border-t border-slate-700">
            <div className="px-4 py-2 text-sm text-slate-400">
              <div className="font-medium text-white">{user?.name}</div>
              <div className="text-xs mt-1">
                {user?.role === 'admin' ? '👑 Admin' : '👤 Member'}
              </div>
              <div className="text-xs mt-2">
                Credits: <span className="text-primary-400 font-bold">{user?.credits ?? 0}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}

