import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { supabase } from './supabase'
import { env } from '../env'

const QUEUE_KEY = 'minesweeper_sync_queue'

interface SyncOperation {
  id: string
  method: string
  path: string
  body?: unknown
  createdAt: number
}

export async function enqueue(op: Omit<SyncOperation, 'id' | 'createdAt'>): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  const queue: SyncOperation[] = raw ? JSON.parse(raw) : []
  queue.push({ ...op, id: `${Date.now()}_${Math.random()}`, createdAt: Date.now() })
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY)
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch()
  return state.isConnected ?? false
}

export async function processQueue(): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  if (!raw) return
  const queue: SyncOperation[] = JSON.parse(raw)
  const remaining: SyncOperation[] = []
  for (const op of queue) {
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? null
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      await fetch(`${env.API_URL}${op.path}`, {
        method: op.method,
        headers,
        body: op.body ? JSON.stringify(op.body) : undefined,
      })
    } catch {
      remaining.push(op)
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
}
