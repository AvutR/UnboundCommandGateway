import { useEffect, useState } from 'react'
import { commandsApi, CommandDetail } from '../api/client'
import { CheckCircle, XCircle, Clock, Terminal, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

export default function CommandHistory() {
  const [commands, setCommands] = useState<CommandDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCommands = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await commandsApi.list()
      setCommands(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load commands')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCommands()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircle size={20} className="text-green-400" />
      case 'REJECTED':
        return <XCircle size={20} className="text-red-400" />
      case 'PENDING':
        return <Clock size={20} className="text-yellow-400" />
      default:
        return <Terminal size={20} className="text-slate-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Command History</h1>
          <p className="text-slate-400">View all your submitted commands</p>
        </div>
        <button
          onClick={loadCommands}
          disabled={loading}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {loading && commands.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
          <p className="text-slate-400 mt-4">Loading commands...</p>
        </div>
      ) : commands.length === 0 ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
          <Terminal size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No commands found</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Command
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {commands.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(cmd.action_taken)}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          cmd.action_taken === 'ACCEPTED' ? 'bg-green-900/50 text-green-300' :
                          cmd.action_taken === 'REJECTED' ? 'bg-red-900/50 text-red-300' :
                          'bg-yellow-900/50 text-yellow-300'
                        }`}>
                          {cmd.action_taken}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-white font-mono">{cmd.command_text}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {cmd.cost > 0 ? `-${cmd.cost}` : '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm">
                      {format(new Date(cmd.created_at), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {commands.length > 0 && (
        <div className="text-center text-slate-400 text-sm">
          Showing {commands.length} command{commands.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

