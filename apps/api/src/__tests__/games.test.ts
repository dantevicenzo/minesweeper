import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createServer } from 'node:http'
import type { Server } from 'node:http'

vi.mock('../utils/supabase', () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    range: vi.fn().mockReturnThis(),
  }

  const mockSupabase = {
    from: vi.fn(() => mockQuery),
  }

  return { supabase: mockSupabase }
})

async function createTestServer() {
  const { default: app } = await import('../main')
  return new Promise<{ server: Server; port: number; url: string }>((resolve, reject) => {
    const server = createServer(app)
    server.listen(0, () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to get address'))
        return
      }
      resolve({ server, port: addr.port, url: `http://localhost:${addr.port}` })
    })
  })
}

describe('Games API', () => {
  let ctx: { server: Server; url: string }

  beforeAll(async () => {
    ctx = await createTestServer()
  })

  afterAll(() => {
    ctx.server.close()
  })

  it('returns 401 without auth token', async () => {
    const res = await fetch(`${ctx.url}/api/games`, { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('returns 401 for GET without auth', async () => {
    const res = await fetch(`${ctx.url}/api/games`)
    expect(res.status).toBe(401)
  })
})
