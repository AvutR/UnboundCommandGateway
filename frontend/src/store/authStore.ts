import { create } from 'zustand'

interface User {
  id: string
  name: string
  role: 'admin' | 'member'
  credits: number
}

interface AuthState {
  apiKey: string | null
  user: User | null
  setApiKey: (key: string) => void
  setUser: (user: User) => void
  logout: () => void
}

// Load from localStorage on init
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    // Ignore
  }
  return { apiKey: null, user: null }
}

const saveToStorage = (state: AuthState) => {
  try {
    localStorage.setItem('auth-storage', JSON.stringify({
      apiKey: state.apiKey,
      user: state.user,
    }))
  } catch (e) {
    // Ignore
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const initialState = loadFromStorage()
  
  return {
    ...initialState,
    setApiKey: (key) => {
      set({ apiKey: key })
      saveToStorage({ apiKey: key, user: useAuthStore.getState().user })
    },
    setUser: (user) => {
      set({ user })
      saveToStorage({ apiKey: useAuthStore.getState().apiKey, user })
    },
    logout: () => {
      set({ apiKey: null, user: null })
      localStorage.removeItem('auth-storage')
    },
  }
})

