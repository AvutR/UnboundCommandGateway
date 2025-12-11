import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { commandsApi } from '../api/client'
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket'
import { 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [recentCommands, setRecentCommands] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    executed: 0,
    rejected: 0,
    pending: 0,
  })

  // Update user credits from WebSocket
  useWebSocket((message: WebSocketMessage) => {
    if (message.type === 'command_update' && message.new_balance !== undefined) {
      useAuthStore.getState().setUser({
        ...user!,
        credits: message.new_balance,
      })
    }
  })

  useEffect(() => {
    loadRecentCommands()
  }, [])

  const loadRecentCommands = async () => {
    try {
      const commands = await commandsApi.list()
      const sorted = commands.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setRecentCommands(sorted.slice(0, 5))
      
      setStats({
        total: commands.length,
        executed: commands.filter(c => c.action_taken === 'ACCEPTED').length,
        rejected: commands.filter(c => c.action_taken === 'REJECTED').length,
        pending: commands.filter(c => c.action_taken === 'PENDING').length,
      })
    } catch (error) {
      console.error('Failed to load commands:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircle size={20} className="text-green-400" />
      case 'REJECTED':
        return <XCircle size={20} className="text-red-400" />
      case 'PENDING':
        return <Clock size={20} className="text-yellow-400" />
      default:
        return <Activity size={20} className="text-slate-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Credits</span>
            <TrendingUp size={20} className="text-primary-400" />
          </div>
          <div className="text-3xl font-bold text-white">{user?.credits ?? 0}</div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Total Commands</span>
            <Terminal size={20} className="text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Executed</span>
            <CheckCircle size={20} className="text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">{stats.executed}</div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Rejected</span>
            <XCircle size={20} className="text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400">{stats.rejected}</div>
        </div>
      </div>

      {/* Recent Commands */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Recent Commands</h2>
        </div>
        <div className="p-6">
          {recentCommands.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No commands yet</p>
          ) : (
            <div className="space-y-4">
              {recentCommands.map((cmd) => (
                <div
                  key={cmd.id}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {getStatusIcon(cmd.action_taken)}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-mono text-sm truncate">
                        {cmd.command_text}
                      </div>
                      <div className="text-slate-400 text-xs mt-1">
                        {format(new Date(cmd.created_at), 'MMM d, yyyy HH:mm:ss')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      cmd.action_taken === 'ACCEPTED' ? 'bg-green-900/50 text-green-300' :
                      cmd.action_taken === 'REJECTED' ? 'bg-red-900/50 text-red-300' :
                      'bg-yellow-900/50 text-yellow-300'
                    }`}>
                      {cmd.action_taken}
                    </span>
                    {cmd.cost > 0 && (
                      <span className="text-slate-400 text-xs">-{cmd.cost} credit</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

