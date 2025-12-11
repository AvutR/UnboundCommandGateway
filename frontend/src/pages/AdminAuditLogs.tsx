import { useEffect, useState } from 'react'
import { adminApi, AuditLog } from '../api/client'
import { FileText, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listAuditLogs()
      setLogs(data)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes('EXECUTED')) return 'bg-green-900/50 text-green-300'
    if (eventType.includes('REJECTED')) return 'bg-red-900/50 text-red-300'
    if (eventType.includes('PENDING')) return 'bg-yellow-900/50 text-yellow-300'
    return 'bg-blue-900/50 text-blue-300'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
        <p className="text-slate-400">Complete audit trail of all system events</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
          <p className="text-slate-400 mt-4">Loading audit logs...</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(log.event_type)}`}>
                          {log.event_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-300 font-mono max-w-md truncate">
                          {log.details ? JSON.stringify(log.details, null, 2) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm">
                        {log.actor_user_id ? (
                          <div className="flex items-center gap-2">
                            <User size={16} />
                            {log.actor_user_id.substring(0, 8)}...
                          </div>
                        ) : (
                          <span className="text-slate-500">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

