import { describe, it, expect, vi, afterAll } from 'vitest'
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
        .then(res => { server.close(); resolve(res) })
        .catch(err => { server.close(); reject(err) })
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
      if (token === 'invalid-token') return new Response(null, { status: 401 })
      return new Response(JSON.stringify({ id: 'test-user-id' }), { status: 200 })
    }
    if (url.startsWith('http://localhost')) return realFetch(input, init)
    return new Response(null, { status: 404 })
  })
}

describe('GET /api/profiles/me', () => {
  afterAll(() => vi.restoreAllMocks())

  it('returns 401 without auth', async () => {
    mockAuthFetch()
    const res = await createTestServer('/api/profiles/me')
    expect(res.status).toBe(401)
  })

  it('returns profile when username is null', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce({
      id: 'test-user-id', username: null, full_name: 'Player', email: 'p@example.com',
      avatar_url: null, xp: 0, level: 1, banned: false, created_at: '2026-01-01', updated_at: '2026-01-01',
    })
    const res = await createTestServer('/api/profiles/me', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile.username).toBeNull()
  })

  it('returns profile when username is set', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce({
      id: 'test-user-id', username: 'alice', full_name: 'Alice', email: 'a@example.com',
      avatar_url: null, xp: 100, level: 2, banned: false, created_at: '2026-01-01', updated_at: '2026-01-01',
    })
    const res = await createTestServer('/api/profiles/me', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile.username).toBe('alice')
  })

  it('returns 404 when profile not found', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce(null)
    const res = await createTestServer('/api/profiles/me', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(404)
  })
})

describe('GET /api/profiles/username-available', () => {
  afterAll(() => vi.restoreAllMocks())

  it('returns 401 without auth', async () => {
    mockAuthFetch()
    const res = await createTestServer('/api/profiles/username-available?u=alice')
    expect(res.status).toBe(401)
  })

  it('returns available=true when username is free', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce(null)
    const res = await createTestServer('/api/profiles/username-available?u=newname', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.available).toBe(true)
  })

  it('returns available=false with reason=taken when username exists', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce({ id: 'other-user' })
    const res = await createTestServer('/api/profiles/username-available?u=alice', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.available).toBe(false)
    expect(body.reason).toBe('taken')
  })

  it('returns available=false with reason=invalid for bad regex', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    const res = await createTestServer('/api/profiles/username-available?u=ab', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.available).toBe(false)
    expect(body.reason).toBe('invalid')
  })

  it('returns available=false with reason=banned for reserved word', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    const res = await createTestServer('/api/profiles/username-available?u=admin', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.available).toBe(false)
    expect(body.reason).toBe('banned')
  })
})

describe('PATCH /api/profiles/me', () => {
  afterAll(() => vi.restoreAllMocks())

  it('returns 401 without auth', async () => {
    mockAuthFetch()
    const res = await createTestServer('/api/profiles/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice' }),
    })
    expect(res.status).toBe(401)
  })

  it('updates username and returns profile', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce(null)
    mockQueryOne.mockResolvedValueOnce({
      id: 'test-user-id', username: 'alice', full_name: 'Alice', email: 'a@example.com',
      avatar_url: null, xp: 0, level: 1, banned: false, created_at: '2026-01-01', updated_at: '2026-06-18',
    })
    const res = await createTestServer('/api/profiles/me', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', full_name: 'Alice' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile.username).toBe('alice')
  })

  it('returns 400 for invalid username regex', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    const res = await createTestServer('/api/profiles/me', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ab' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 for banned word', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    const res = await createTestServer('/api/profiles/me', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 409 when username taken', async () => {
    mockAuthFetch()
    mockQueryOne.mockResolvedValueOnce({ banned: false })
    mockQueryOne.mockResolvedValueOnce({ id: 'other-user' })
    const res = await createTestServer('/api/profiles/me', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice' }),
    })
    expect(res.status).toBe(409)
  })
})
