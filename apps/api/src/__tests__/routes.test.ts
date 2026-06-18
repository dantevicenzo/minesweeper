import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createServer } from 'node:http'

const mockQuery = vi.fn()
const mockQueryOne = vi.fn()

vi.mock('../../api/utils/supabase', () => ({
  query: mockQuery,
  queryOne: mockQueryOne,
}))

async function createTestServer(path: string, options?: RequestInit) {
  const { default: app } = await import('../../api/index')
  return new Promise<Response>((resolve, reject) => {
    const server = createServer(app)
    server.listen(0, () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to get address'))
        return
      }
      const url = `http://localhost:${addr.port}${path}`
      fetch(url, options)
        .then(res => {
          server.close()
          resolve(res)
        })
        .catch(err => {
          server.close()
          reject(err)
        })
    })
  })
}

const realFetch = globalThis.fetch

function mockAuthFetch() {
  vi.restoreAllMocks()
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as any).url
    if (url.includes('/auth/v1/user')) {
      const token = init?.headers && typeof init.headers === 'object' && !Array.isArray(init.headers)
        ? (init.headers as Record<string, string>)['Authorization']?.replace('Bearer ', '')
        : undefined
      if (token === 'invalid-token') {
        return new Response(null, { status: 401 })
      }
      return new Response(JSON.stringify({ id: 'test-user-id' }), { status: 200 })
    }
    if (url.startsWith('http://localhost')) {
      return realFetch(input, init)
    }
    return new Response(null, { status: 404 })
  })
}

describe('Games API', () => {
  afterAll(() => {
    vi.restoreAllMocks()
  })

  it('returns 401 without auth token', async () => {
    mockAuthFetch()
    const res = await createTestServer('/api/games', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('returns 401 for GET without auth', async () => {
    mockAuthFetch()
    const res = await createTestServer('/api/games')
    expect(res.status).toBe(401)
  })

  it('creates a game with auth', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce({ id: 'game-1', width: 9, height: 9, mine_count: 10, difficulty: 'easy', status: 'in_progress' })

    const res = await createTestServer('/api/games', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ width: 9, height: 9, mineCount: 10, difficulty: 'easy', state: { board: [] } }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('game-1')
  })

  it('rejects game creation with missing fields', async () => {
    mockAuthFetch()
    const res = await createTestServer('/api/games', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ width: 9 }),
    })
    expect(res.status).toBe(400)
  })

  it('lists games for authenticated user', async () => {
    mockAuthFetch()
    mockQuery.mockResolvedValueOnce([{ id: 'game-1', status: 'in_progress' }, { id: 'game-2', status: 'won' }])

    const res = await createTestServer('/api/games', {
      headers: { 'Authorization': 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(2)
  })

  it('filters games by status', async () => {
    mockAuthFetch()
    mockQuery.mockResolvedValueOnce([{ id: 'game-1', status: 'in_progress' }])

    const res = await createTestServer('/api/games?status=in_progress', {
      headers: { 'Authorization': 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
  })

  it('gets a single game by id', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ id: 'game-1', user_id: 'test-user-id', status: 'in_progress' })

    const res = await createTestServer('/api/games/game-1', {
      headers: { 'Authorization': 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('game-1')
  })

  it('returns 404 for non-existent game', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce(null)

    const res = await createTestServer('/api/games/non-existent', {
      headers: { 'Authorization': 'Bearer valid-token' },
    })
    expect(res.status).toBe(404)
  })

  it('updates a game', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce({ id: 'game-1', user_id: 'test-user-id', status: 'in_progress', difficulty: 'easy', state: { board: [] }, completed_at: null, duration_ms: null })
    mockQueryOne.mockResolvedValueOnce({ id: 'game-1', status: 'won' })

    const res = await createTestServer('/api/games/game-1', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'won', duration_ms: 30000, state: { board: [] } }),
    })
    expect(res.status).toBe(200)
  })

  it('deletes a game', async () => {
    mockAuthFetch()
    const res = await createTestServer('/api/games/game-1', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer valid-token' },
    })
    expect(res.status).toBe(204)
  })

  it('rejects invalid auth token', async () => {
    mockAuthFetch()
    const res = await createTestServer('/api/games', {
      headers: { 'Authorization': 'Bearer invalid-token' },
    })
    expect(res.status).toBe(401)
  })
})

describe('Leaderboard API', () => {
  afterAll(() => {
    vi.restoreAllMocks()
  })

  it('returns leaderboard entries', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 'entry-1', player_name: 'Test', duration_ms: 10000 }])
    mockQueryOne.mockResolvedValueOnce({ count: 1 })

    const res = await createTestServer('/api/leaderboard?difficulty=easy&page=1&limit=20')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(body.pagination).toBeDefined()
  })
})

describe('Achievements API', () => {
  afterAll(() => {
    vi.restoreAllMocks()
  })

  it('lists all achievements', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 'ach-1', key: 'first_win', name: 'First Win' }])

    const res = await createTestServer('/api/achievements')
    expect(res.status).toBe(200)
  })

  it('returns user achievements', async () => {
    mockAuthFetch()
    mockQuery.mockResolvedValueOnce([{ id: 'ach-1', key: 'first_win' }])
    mockQuery.mockResolvedValueOnce([{ achievement_id: 'ach-1', unlocked_at: '2025-01-01' }])

    const res = await createTestServer('/api/achievements/me', {
      headers: { 'Authorization': 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
  })
})

describe('Stats API', () => {
  afterAll(() => {
    vi.restoreAllMocks()
  })

  it('returns player stats with auth', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ id: 'test-user-id', display_name: 'Test', xp: 500, level: 3 })
    mockQueryOne.mockResolvedValueOnce({ total_games: 10, wins: 7, losses: 3, avg_win_time_ms: 30000, best_time_ms: 15000 })
    mockQuery.mockResolvedValueOnce([])
    mockQuery.mockResolvedValueOnce([])

    const res = await createTestServer('/api/stats/me', {
      headers: { 'Authorization': 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
  })
})
