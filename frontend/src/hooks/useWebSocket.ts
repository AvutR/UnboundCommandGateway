import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/authStore'

export interface WebSocketMessage {
  type: 'command_update' | 'approval_request'
  command_id?: string
  status?: 'executed' | 'rejected' | 'pending'
  result?: {
    stdout: string
    stderr: string
    exit_code: number
  }
  new_balance?: number
  reason?: string
  command_text?: string
  submitted_by?: string
  user_name?: string
}

export function useWebSocket(onMessage?: (message: WebSocketMessage) => void) {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const { apiKey } = useAuthStore()

  useEffect(() => {
    if (!apiKey) return

    const WS_URL = import.meta.env.VITE_WS_URL || 
      (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('http', 'ws') + '/ws'
    
    const wsUrl = `${WS_URL}?api_key=${apiKey}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setConnected(true)
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        if (onMessage) {
          onMessage(message)
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      setConnected(false)
      console.log('WebSocket disconnected')
    }

    wsRef.current = ws

    return () => {
      ws.close()
    }
  }, [apiKey, onMessage])

  return { connected, ws: wsRef.current }
}

