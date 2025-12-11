import { useState } from 'react'
import { commandsApi, CommandResponse } from '../api/client'
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket'
import { useAuthStore } from '../store/authStore'
import { Terminal, Send, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

export default function Commands() {
  const [commandText, setCommandText] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<CommandResponse | null>(null)
  const { user, setUser } = useAuthStore()

  // Handle WebSocket updates
  useWebSocket((message: WebSocketMessage) => {
    if (message.type === 'command_update') {
      if (message.new_balance !== undefined && user) {
        setUser({ ...user, credits: message.new_balance })
      }
      // Update last result if it matches
      if (lastResult?.command_id === message.command_id) {
        setLastResult({
          ...lastResult,
          status: message.status || lastResult.status,
          result: message.result || lastResult.result,
          new_balance: message.new_balance || lastResult.new_balance,
        })
      }
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commandText.trim() || loading) return

    setLoading(true)
    setLastResult(null)

    try {
      const result = await commandsApi.submit({ command_text: commandText })
      setLastResult(result)
      
      // Update credits if provided
      if (result.new_balance !== undefined && user) {
        setUser({ ...user, credits: result.new_balance })
      }
      
      // Clear input on success
      if (result.status === 'executed') {
        setCommandText('')
      }
    } catch (error: any) {
      setLastResult({
        status: 'rejected',
        reason: error.response?.data?.detail || 'Failed to submit command',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'executed':
        return <CheckCircle size={24} className="text-green-400" />
      case 'rejected':
        return <XCircle size={24} className="text-red-400" />
      case 'pending':
        return <Clock size={24} className="text-yellow-400" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Submit Command</h1>
        <p className="text-slate-400">Enter a command to execute</p>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="command" className="block text-sm font-medium text-slate-300 mb-2">
              Command
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Terminal className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  id="command"
                  type="text"
                  value={commandText}
                  onChange={(e) => setCommandText(e.target.value)}
                  placeholder="Enter command (e.g., ls -la, pwd, echo hello)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !commandText.trim()}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={20} />
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {user && (
            <div className="text-sm text-slate-400">
              Credits remaining: <span className="text-primary-400 font-bold">{user.credits}</span>
            </div>
          )}
        </form>
      </div>

      {/* Result Display */}
      {lastResult && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            {getStatusIcon(lastResult.status)}
            <h2 className="text-xl font-semibold text-white">
              Command {lastResult.status}
            </h2>
          </div>

          {lastResult.reason && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <div className="flex items-center gap-2 text-red-200">
                <AlertCircle size={20} />
                <span>{lastResult.reason}</span>
              </div>
            </div>
          )}

          {lastResult.status === 'executed' && lastResult.result && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Output</h3>
                <pre className="p-4 bg-slate-900 rounded-lg text-green-400 font-mono text-sm overflow-x-auto border border-slate-700">
                  {lastResult.result.stdout || '(no output)'}
                </pre>
              </div>
              
              {lastResult.result.stderr && (
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Error</h3>
                  <pre className="p-4 bg-slate-900 rounded-lg text-red-400 font-mono text-sm overflow-x-auto border border-slate-700">
                    {lastResult.result.stderr}
                  </pre>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm">
                <div className="text-slate-400">
                  Exit code: <span className="text-white font-mono">{lastResult.result.exit_code}</span>
                </div>
                {lastResult.new_balance !== undefined && (
                  <div className="text-slate-400">
                    New balance: <span className="text-primary-400 font-bold">{lastResult.new_balance}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {lastResult.status === 'pending' && (
            <div className="p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-200">
                <Clock size={20} />
                <span>Command is pending approval from an administrator.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Examples */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {['ls -la', 'pwd', 'echo "Hello World"', 'cat file.txt'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => setCommandText(cmd)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-left font-mono text-sm transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

