import { useEffect, useState } from 'react'
import { adminApi, Rule, RuleCreate } from '../api/client'
import { Shield, Plus, Trash2, Edit2, X, Save } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminRules() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newRule, setNewRule] = useState<RuleCreate>({
    priority: 10,
    pattern: '',
    action: 'AUTO_ACCEPT',
    description: '',
  })
  const [editRule, setEditRule] = useState<Partial<RuleCreate>>({})

  const loadRules = async () => {
    setLoading(true)
    try {
      // Note: Backend might need a GET /admin/rules endpoint
      // For now, we'll handle the case where it doesn't exist
      try {
        const data = await adminApi.listRules()
        setRules(data.sort((a, b) => a.priority - b.priority))
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Endpoint doesn't exist yet, show empty state
          setRules([])
        } else {
          throw error
        }
      }
    } catch (error) {
      console.error('Failed to load rules:', error)
      alert('Failed to load rules. The GET /admin/rules endpoint may need to be added to the backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [])

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await adminApi.createRule(newRule)
      setNewRule({ priority: 10, pattern: '', action: 'AUTO_ACCEPT', description: '' })
      setShowCreateModal(false)
      await loadRules()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create rule')
    }
  }

  const handleUpdateRule = async (id: string) => {
    try {
      await adminApi.updateRule(id, editRule)
      setEditingId(null)
      setEditRule({})
      await loadRules()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update rule')
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return
    
    try {
      await adminApi.deleteRule(id)
      await loadRules()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete rule')
    }
  }

  const startEdit = (rule: Rule) => {
    setEditingId(rule.id)
    setEditRule({
      priority: rule.priority,
      pattern: rule.pattern,
      action: rule.action,
      description: rule.description,
    })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'AUTO_ACCEPT':
        return 'bg-green-900/50 text-green-300'
      case 'AUTO_REJECT':
        return 'bg-red-900/50 text-red-300'
      case 'REQUIRE_APPROVAL':
        return 'bg-yellow-900/50 text-yellow-300'
      default:
        return 'bg-slate-700 text-slate-300'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Rule Management</h1>
          <p className="text-slate-400">Manage command execution rules</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Create Rule
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
          <p className="text-slate-400 mt-4">Loading rules...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
          <Shield size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No rules found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-slate-800 rounded-lg border border-slate-700 p-6"
            >
              {editingId === rule.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Priority
                      </label>
                      <input
                        type="number"
                        value={editRule.priority ?? rule.priority}
                        onChange={(e) => setEditRule({ ...editRule, priority: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Action
                      </label>
                      <select
                        value={editRule.action ?? rule.action}
                        onChange={(e) => setEditRule({ ...editRule, action: e.target.value as any })}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="AUTO_ACCEPT">Auto Accept</option>
                        <option value="AUTO_REJECT">Auto Reject</option>
                        <option value="REQUIRE_APPROVAL">Require Approval</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Pattern (Regex)
                    </label>
                    <input
                      type="text"
                      value={editRule.pattern ?? rule.pattern}
                      onChange={(e) => setEditRule({ ...editRule, pattern: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="^ls|^cat"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editRule.description ?? rule.description ?? ''}
                      onChange={(e) => setEditRule({ ...editRule, description: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateRule(rule.id)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Save size={16} />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setEditRule({})
                      }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-sm font-mono">
                        Priority: {rule.priority}
                      </span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getActionColor(rule.action)}`}>
                        {rule.action.replace('_', ' ')}
                      </span>
                    </div>
                    <code className="block text-green-400 font-mono text-sm mb-2 bg-slate-900 p-2 rounded">
                      {rule.pattern}
                    </code>
                    {rule.description && (
                      <p className="text-slate-400 text-sm">{rule.description}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-2">
                      Created {format(new Date(rule.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEdit(rule)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 bg-red-900/50 hover:bg-red-800 text-red-300 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Create New Rule</h2>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={newRule.priority}
                    onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Lower number = higher priority</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Action
                  </label>
                  <select
                    value={newRule.action}
                    onChange={(e) => setNewRule({ ...newRule, action: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="AUTO_ACCEPT">Auto Accept</option>
                    <option value="AUTO_REJECT">Auto Reject</option>
                    <option value="REQUIRE_APPROVAL">Require Approval</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Pattern (Regex)
                </label>
                <input
                  type="text"
                  value={newRule.pattern}
                  onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="^ls|^cat"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Regular expression pattern to match commands</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Auto-accept safe read-only commands"
                />
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
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

