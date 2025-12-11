import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add API key to all requests
apiClient.interceptors.request.use((config) => {
  const apiKey = useAuthStore.getState().apiKey
  if (apiKey) {
    config.headers['X-API-KEY'] = apiKey
  }
  return config
})

export interface CommandRequest {
  command_text: string
}

export interface CommandResponse {
  status: 'executed' | 'rejected' | 'pending'
  reason?: string
  result?: {
    stdout: string
    stderr: string
    exit_code: number
  }
  new_balance?: number
  command_id?: string
}

export interface CommandDetail {
  id: string
  user_id: string
  command_text: string
  matched_rule_id?: string
  action_taken: 'ACCEPTED' | 'REJECTED' | 'PENDING'
  cost: number
  result?: {
    stdout: string
    stderr: string
    exit_code: number
  }
  executed_at?: string
  created_at: string
}

export interface User {
  id: string
  name: string
  role: 'admin' | 'member'
  credits: number
  created_at: string
}

export interface UserCreate {
  name: string
  role: 'admin' | 'member'
}

export interface UserWithApiKey extends User {
  api_key: string
}

export interface Rule {
  id: string
  priority: number
  pattern: string
  action: 'AUTO_ACCEPT' | 'AUTO_REJECT' | 'REQUIRE_APPROVAL'
  description?: string
  created_at: string
}

export interface RuleCreate {
  priority: number
  pattern: string
  action: 'AUTO_ACCEPT' | 'AUTO_REJECT' | 'REQUIRE_APPROVAL'
  description?: string
}

export interface AuditLog {
  id: string
  actor_user_id?: string
  event_type: string
  details?: any
  created_at: string
}

export const commandsApi = {
  submit: async (command: CommandRequest): Promise<CommandResponse> => {
    const response = await apiClient.post<CommandResponse>('/commands', command)
    return response.data
  },
  
  list: async (): Promise<CommandDetail[]> => {
    const response = await apiClient.get<CommandDetail[]>('/commands')
    return response.data
  },
  
  get: async (id: string): Promise<CommandDetail> => {
    const response = await apiClient.get<CommandDetail>(`/commands/${id}`)
    return response.data
  },
}

export const adminApi = {
  createUser: async (user: UserCreate): Promise<UserWithApiKey> => {
    const response = await apiClient.post<UserWithApiKey>('/admin/users', user)
    return response.data
  },
  
  listUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/admin/users')
    return response.data
  },
  
  createRule: async (rule: RuleCreate): Promise<Rule> => {
    const response = await apiClient.post<Rule>('/admin/rules', rule)
    return response.data
  },
  
  updateRule: async (id: string, rule: Partial<RuleCreate>): Promise<Rule> => {
    const response = await apiClient.put<Rule>(`/admin/rules/${id}`, rule)
    return response.data
  },
  
  deleteRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/rules/${id}`)
  },
  
  listRules: async (): Promise<Rule[]> => {
    // Try to get rules - if endpoint doesn't exist, return empty array
    try {
      const response = await apiClient.get<Rule[]>('/admin/rules')
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Endpoint doesn't exist yet - return empty array
        return []
      }
      throw error
    }
  },
  
  updateUserCredits: async (userId: string, credits: number): Promise<User> => {
    const response = await apiClient.put<User>(`/admin/users/${userId}`, { credits })
    return response.data
  },
  
  listAuditLogs: async (): Promise<AuditLog[]> => {
    const response = await apiClient.get<AuditLog[]>('/admin/audit-logs')
    return response.data
  },
}

