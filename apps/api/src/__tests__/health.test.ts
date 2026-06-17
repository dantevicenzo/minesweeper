import { describe, it, expect } from 'vitest'
import { createServer } from 'node:http'
import app from '../index'

function request(path: string, options?: RequestInit): Promise<Response> {
  return new Promise((resolve, reject) => {
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

describe('Health endpoint', () => {
  it('returns ok', async () => {
    const res = await request('/api/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ status: 'ok' })
  })
})
