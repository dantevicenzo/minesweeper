const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const supabase = (await import('./supabase')).supabase
  const token = (await supabase.auth.getSession()).data.session?.access_token

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }

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
    list: (difficulty = 'easy', page = 1, limit = 20) =>
      request<{ data: unknown[]; pagination: unknown }>(
        `/api/leaderboard?difficulty=${difficulty}&page=${page}&limit=${limit}`
      ),

    me: (difficulty = 'easy') =>
      request<unknown>(`/api/leaderboard/me?difficulty=${difficulty}`),
  },

  stats: {
    me: () => request<unknown>('/api/stats/me'),

    get: (userId: string) => request<unknown>(`/api/stats/${userId}`),
  },

  achievements: {
    list: () => request<unknown[]>('/api/achievements'),

    me: () => request<unknown[]>('/api/achievements/me'),
  },
}
