import { useEffect, useState } from 'react'
import { adminApi, User, UserCreate, UserWithApiKey } from '../api/client'
import { Users, Plus, Copy, Check, AlertCircle, Edit2, Save, X } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUser, setNewUser] = useState<UserCreate>({ name: '', role: 'member' })
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [editingCredits, setEditingCredits] = useState<string | null>(null)
  const [creditValue, setCreditValue] = useState<number>(0)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listUsers()
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result: UserWithApiKey = await adminApi.createUser(newUser)
      setCreatedApiKey(result.api_key)
      setNewUser({ name: '', role: 'member' })
      await loadUsers()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create user')
    }
  }

  const copyApiKey = () => {
    if (createdApiKey) {
      navigator.clipboard.writeText(createdApiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const startEditCredits = (user: User) => {
    setEditingCredits(user.id)
    setCreditValue(user.credits)
  }

  const cancelEditCredits = () => {
    setEditingCredits(null)
    setCreditValue(0)
  }

  const saveCredits = async (userId: string) => {
    try {
      await adminApi.updateUserCredits(userId, creditValue)
      await loadUsers()
      setEditingCredits(null)
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update credits')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-slate-400">Manage users and their API keys</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Create User
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
          <p className="text-slate-400 mt-4">Loading users...</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-white">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-900/50 text-purple-300' 
                          : 'bg-blue-900/50 text-blue-300'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCredits === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={creditValue}
                            onChange={(e) => setCreditValue(parseInt(e.target.value) || 0)}
                            className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                            min="0"
                          />
                          <button
                            onClick={() => saveCredits(user.id)}
                            className="p-1 text-green-400 hover:text-green-300"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={cancelEditCredits}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{user.credits}</span>
                          <button
                            onClick={() => startEditCredits(user)}
                            className="p-1 text-slate-500 hover:text-primary-400"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Create New User</h2>
            
            {createdApiKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-200 mb-2">
                    <AlertCircle size={20} />
                    <span className="font-medium">API Key Generated</span>
                  </div>
                  <p className="text-sm text-yellow-200/80 mb-3">
                    Save this API key now. You won't be able to see it again!
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-slate-900 rounded text-white font-mono text-sm break-all">
                      {createdApiKey}
                    </code>
                    <button
                      onClick={copyApiKey}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreatedApiKey(null)
                  }}
                  className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'member' })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

