const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const supabase = (await import('./supabase')).supabase
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const { enqueue } = await import('./sync')
    enqueue({
      method: options?.method ?? 'GET',
      path,
      body: options?.body ? JSON.parse(options.body as string) : undefined,
    })
    throw new Error('offline')
  }

  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }

    if (res.status === 204) return undefined as T
    return res.json()
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      const { enqueue } = await import('./sync')
      enqueue({
        method: options?.method ?? 'GET',
        path,
        body: options?.body ? JSON.parse(options.body as string) : undefined,
      })
    }
    throw err
  }
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
    list: (difficulty = 'easy', page = 1, limit = 20, period = 'all', custom?: { width: number; height: number; mineCount: number }) => {
      let url = `/api/leaderboard?difficulty=${difficulty}&page=${page}&limit=${limit}&period=${period}`
      if (custom) url += `&width=${custom.width}&height=${custom.height}&mineCount=${custom.mineCount}`
      return request<{ data: unknown[]; pagination: unknown }>(url)
    },

    me: (difficulty = 'easy', period = 'all', custom?: { width: number; height: number; mineCount: number }) => {
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
}
