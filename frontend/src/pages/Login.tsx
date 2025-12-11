import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { apiClient } from '../api/client'
import { Terminal, AlertCircle } from 'lucide-react'

export default function Login() {
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setApiKey: setAuthApiKey, setUser } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Test the API key by making a request
      const response = await apiClient.get('/admin/users', {
        headers: { 'X-API-KEY': apiKey },
      })

      // If we get here, the API key is valid
      // For now, we'll create a mock user object
      // In a real app, you'd have a /me endpoint
      setAuthApiKey(apiKey)
      
      // Try to get user info from the users list
      const users = response.data as any[]
      const currentUser = users.find((u: any) => u.api_key === apiKey) || users[0]
      
      if (currentUser) {
        setUser({
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          credits: currentUser.credits,
        })
      }

      navigate('/')
    } catch (err: any) {
      // Try commands endpoint as fallback (for non-admin users)
      try {
        await apiClient.get('/commands', {
          headers: { 'X-API-KEY': apiKey },
        })
        
        setAuthApiKey(apiKey)
        // For non-admin, we'll need to fetch user info differently
        // For now, create a placeholder
        setUser({
          id: 'unknown',
          name: 'User',
          role: 'member',
          credits: 100,
        })
        navigate('/')
      } catch (err2) {
        setError('Invalid API key. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl mb-4">
              <Terminal size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Command Gateway</h1>
            <p className="text-slate-400">Enter your API key to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">
                API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !apiKey}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connecting...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              Don't have an API key? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

