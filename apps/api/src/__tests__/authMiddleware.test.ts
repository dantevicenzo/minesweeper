import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireAuth, optionalAuth, requireNotBanned } from '../../api/middleware/auth'

vi.mock('../../api/utils/supabase', () => ({
  queryOne: vi.fn(),
  query: vi.fn(),
}))

async function callMiddleware(
  fn: Function,
  req: Record<string, unknown> = {},
): Promise<{ statusCode: number; body: any }> {
  const statusCode: { current: number } = { current: 200 }
  const res: any = {
    status: (code: number) => {
      statusCode.current = code
      return { json: (body: any) => ({ statusCode: code, body }) }
    },
    json: (body: any) => ({ statusCode: statusCode.current, body }),
  }
  let nextCalled = false
  const next = () => { nextCalled = true }

  const result = await fn(req, res, next)

  if (nextCalled) return { statusCode: 200, body: null }
  return result ?? { statusCode: statusCode.current, body: null }
}

describe('requireAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 401 when no token is provided', async () => {
    const req = { headers: {} }
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    const next = vi.fn()

    await requireAuth(req as any, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing authorization token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when token is invalid', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response)

    const req = { headers: { authorization: 'Bearer invalid-token' } }
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    const next = vi.fn()

    await requireAuth(req as any, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next and sets userId when token is valid', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'user-123' }),
    } as Response)

    const req: any = { headers: { authorization: 'Bearer valid-token' } }
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() }
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.userId).toBe('user-123')
  })

  it('handles fetch error gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const req: any = { headers: { authorization: 'Bearer token' } }
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() }
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})

describe('optionalAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls next without userId when no token', async () => {
    const req: any = { headers: {} }
    const next = vi.fn()

    await optionalAuth(req, {} as any, next)

    expect(next).toHaveBeenCalled()
    expect(req.userId).toBeUndefined()
  })

  it('sets userId when valid token is provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'user-456' }),
    } as Response)

    const req: any = { headers: { authorization: 'Bearer valid-token' } }
    const next = vi.fn()

    await optionalAuth(req, {} as any, next)

    expect(next).toHaveBeenCalled()
    expect(req.userId).toBe('user-456')
  })

  it('calls next even when token is invalid (optional)', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response)

    const req: any = { headers: { authorization: 'Bearer invalid' } }
    const next = vi.fn()

    await optionalAuth(req, {} as any, next)

    expect(next).toHaveBeenCalled()
    expect(req.userId).toBeUndefined()
  })
})

describe('requireNotBanned', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls next when no userId', async () => {
    const { queryOne } = await import('../../api/utils/supabase')
    const req: any = {}
    const next = vi.fn()

    await requireNotBanned(req, {} as any, next)

    expect(next).toHaveBeenCalled()
    expect(queryOne).not.toHaveBeenCalled()
  })

  it('calls next when user is not banned', async () => {
    const { queryOne } = await import('../../api/utils/supabase')
    ;(queryOne as any).mockResolvedValue({ banned: false })

    const req: any = { userId: 'user-123' }
    const next = vi.fn()

    await requireNotBanned(req, {} as any, next)

    expect(next).toHaveBeenCalled()
  })

  it('returns 403 when user is banned', async () => {
    const { queryOne } = await import('../../api/utils/supabase')
    ;(queryOne as any).mockResolvedValue({ banned: true })

    const req: any = { userId: 'user-123' }
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() }
    const next = vi.fn()

    await requireNotBanned(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Account is banned' })
    expect(next).not.toHaveBeenCalled()
  })
})
