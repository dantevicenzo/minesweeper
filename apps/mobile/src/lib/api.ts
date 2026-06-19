import NetInfo from '@react-native-community/netinfo'
import { supabase } from './supabase'
import { enqueue } from './sync'
import { env } from '../env'
import type { Profile } from '@minesweeper/types'

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const netState = await NetInfo.fetch()
  if (!netState.isConnected) {
    enqueue({
      method: options.method ?? 'GET',
      path,
      body: options.body ? JSON.parse(options.body as string) : undefined,
    })
    throw new Error('offline')
  }

  const res = await fetch(`${env.API_URL}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  games: {
    list: (status?: string) =>
      request<unknown[]>(`/api/games${status ? `?status=${status}` : ''}`),

    get: (id: string) => request<unknown>(`/api/games/${id}`),

    create: (data: unknown) =>
      request<unknown>('/api/games', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: unknown) =>
      request<unknown>(`/api/games/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<void>(`/api/games/${id}`, { method: 'DELETE' }),
  },

  leaderboard: {
    list: (
      difficulty = 'easy',
      page = 1,
      limit = 20,
      period = 'all',
      custom?: { width: number; height: number; mineCount: number },
    ) => {
      let url = `/api/leaderboard?difficulty=${difficulty}&page=${page}&limit=${limit}&period=${period}`
      if (custom) url += `&width=${custom.width}&height=${custom.height}&mineCount=${custom.mineCount}`
      return request<{ data: unknown[]; pagination: unknown }>(url)
    },

    me: (
      difficulty = 'easy',
      period = 'all',
      custom?: { width: number; height: number; mineCount: number },
    ) => {
      let url = `/api/leaderboard/me?difficulty=${difficulty}&period=${period}`
      if (custom) url += `&width=${custom.width}&height=${custom.height}&mineCount=${custom.mineCount}`
      return request<unknown>(url)
    },
  },

  stats: {
    me: () => request<unknown>('/api/stats/me'),

    get: (userId: string) => request<unknown>(`/api/stats/${userId}`),
  },

  achievements: {
    list: () => request<unknown[]>('/api/achievements'),

    me: () => request<unknown[]>('/api/achievements/me'),

    get: (userId: string) => request<unknown[]>(`/api/achievements/${userId}`),
  },

  profiles: {
    me: () => request<{ profile: Profile }>('/api/profiles/me'),

    usernameAvailable: (username: string) =>
      request<{ available: boolean; reason?: 'taken' | 'invalid' | 'banned' }>(
        `/api/profiles/username-available?u=${encodeURIComponent(username)}`,
      ),

    updateMe: (data: { username: string; full_name?: string }) =>
      request<{ profile: Profile }>('/api/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
}
