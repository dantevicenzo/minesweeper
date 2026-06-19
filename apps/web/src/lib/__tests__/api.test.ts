import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  supabase: { auth: { getSession: vi.fn() } },
  enqueue: vi.fn(),
}))

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
    },
  },
}))

vi.mock('../sync', () => ({
  enqueue: mocks.enqueue,
}))

async function getApi() {
  return (await import('../api')).api
}

beforeEach(() => {
  vi.restoreAllMocks()
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'test-token' } } })
  global.navigator = { ...navigator, onLine: true }
  global.fetch = vi.fn()
})

describe('api.stats', () => {
  it('GET /api/stats/me makes authenticated request', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ profile: { xp: 100 } }),
    })

    const api = await getApi()
    const result = await api.stats.me()

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stats/me'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    )
    expect(result).toEqual({ profile: { xp: 100 } })
  })

  it('GET /api/stats/:userId makes public request with auth header', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ profile: { username: 'player', full_name: 'Player' } }),
    })

    const api = await getApi()
    const result = await api.stats.get('user-abc')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stats/user-abc'),
      expect.anything(),
    )
    expect(result).toEqual({ profile: { username: 'player', full_name: 'Player' } })
  })
})

describe('api.achievements', () => {
  it('GET /api/achievements/:userId fetches user achievements', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ key: 'first_win', unlocked: true }]),
    })

    const api = await getApi()
    const result = await api.achievements.get('user-xyz')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/achievements/user-xyz'),
      expect.anything(),
    )
    expect(result).toEqual([{ key: 'first_win', unlocked: true }])
  })

  it('GET /api/achievements/me fetches own achievements', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ key: 'first_win', unlocked: true }]),
    })

    const api = await getApi()
    const result = await api.achievements.me()

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/achievements/me'),
      expect.anything(),
    )
    expect(result).toEqual([{ key: 'first_win', unlocked: true }])
  })
})

describe('api.games', () => {
  it('POST /api/games sends body as JSON', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'game-1' }),
    })

    const api = await getApi()
    const gameData = { difficulty: 'easy', width: 9, height: 9, mineCount: 10 }
    await api.games.create(gameData)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/games'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(gameData),
      }),
    )
  })

  it('PUT /api/games/:id updates game state', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'game-1', status: 'won' }),
    })

    const api = await getApi()
    await api.games.update('game-1', { status: 'won', state: {} })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/games/game-1'),
      expect.objectContaining({ method: 'PUT' }),
    )
  })
})

describe('api.leaderboard', () => {
  it('GET /api/leaderboard with filters', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], pagination: { page: 1 } }),
    })

    const api = await getApi()
    await api.leaderboard.list('hard', 2, 10, 'week')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('difficulty=hard&page=2&limit=10&period=week'),
      expect.anything(),
    )
  })

  it('GET /api/leaderboard with custom config', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], pagination: { page: 1 } }),
    })

    const api = await getApi()
    await api.leaderboard.list('custom', 1, 20, 'all', { width: 20, height: 15, mineCount: 50 })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('width=20&height=15&mineCount=50'),
      expect.anything(),
    )
  })
})

describe('error handling', () => {
  it('rejects with error message from response body', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    })

    const api = await getApi()
    await expect(api.stats.me()).rejects.toThrow('Server error')
  })

  it('rejects with HTTP status when no error body', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('invalid json')),
    })

    const api = await getApi()
    await expect(api.stats.me()).rejects.toThrow('HTTP 500')
  })

  it('returns undefined for 204 responses', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.reject(new Error('no body')),
    })

    const api = await getApi()
    const result = await api.games.delete('game-1')
    expect(result).toBeUndefined()
  })
})
