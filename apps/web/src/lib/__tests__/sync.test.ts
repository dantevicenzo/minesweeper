import { describe, it, expect, beforeEach, vi } from 'vitest'
import { clearQueue, enqueue, isOnline, processQueue, setupSyncListener } from '../sync'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('enqueue', () => {
  it('adds an operation to the queue', () => {
    enqueue({ method: 'POST', path: '/api/games', body: { x: 1 } })
    const raw = localStorage.getItem('minesweeper_sync_queue')
    expect(raw).not.toBeNull()
    const queue = JSON.parse(raw!)
    expect(queue).toHaveLength(1)
    expect(queue[0].method).toBe('POST')
    expect(queue[0].path).toBe('/api/games')
    expect(queue[0].body).toEqual({ x: 1 })
    expect(queue[0].id).toBeDefined()
    expect(queue[0].createdAt).toBeDefined()
  })

  it('appends to existing queue', () => {
    enqueue({ method: 'GET', path: '/api/games/1' })
    enqueue({ method: 'DELETE', path: '/api/games/1' })
    const raw = localStorage.getItem('minesweeper_sync_queue')
    const queue = JSON.parse(raw!)
    expect(queue).toHaveLength(2)
  })

  it('handles localStorage errors gracefully', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('fail')
    })
    expect(() => enqueue({ method: 'GET', path: '/test' })).not.toThrow()
  })
})

describe('clearQueue', () => {
  it('removes the queue from localStorage', () => {
    enqueue({ method: 'GET', path: '/test' })
    clearQueue()
    expect(localStorage.getItem('minesweeper_sync_queue')).toBeNull()
  })

  it('does not throw when queue does not exist', () => {
    expect(() => clearQueue()).not.toThrow()
  })

  it('handles localStorage errors gracefully', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('fail')
    })
    expect(() => clearQueue()).not.toThrow()
  })
})

describe('isOnline', () => {
  it('returns navigator.onLine when available', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    expect(isOnline()).toBe(true)

    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    expect(isOnline()).toBe(false)
  })

  it('returns true when navigator is undefined', () => {
    const navigatorRef = globalThis.navigator
    delete (globalThis as any).navigator
    expect(isOnline()).toBe(true)
    ;(globalThis as any).navigator = navigatorRef
  })
})

describe('processQueue', () => {
  it('does nothing when queue is empty', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await processQueue()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('processes all items successfully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))
    enqueue({ method: 'GET', path: '/api/games/1' })
    enqueue({ method: 'GET', path: '/api/games/2' })
    await processQueue()
    expect(localStorage.getItem('minesweeper_sync_queue')).toBe('[]')
  })

  it('keeps failed items in queue', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }))
    enqueue({ method: 'GET', path: '/api/games/1' })
    await processQueue()
    const queue = JSON.parse(localStorage.getItem('minesweeper_sync_queue')!)
    expect(queue).toHaveLength(1)
  })

  it('keeps items that throw in queue', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'))
    enqueue({ method: 'GET', path: '/api/games/1' })
    await processQueue()
    const queue = JSON.parse(localStorage.getItem('minesweeper_sync_queue')!)
    expect(queue).toHaveLength(1)
  })

  it('does not run concurrently', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))
    enqueue({ method: 'GET', path: '/api/games/1' })
    enqueue({ method: 'GET', path: '/api/games/2' })
    const results = await Promise.all([processQueue(), processQueue()])
    expect(results).toEqual([undefined, undefined])
    const queue = JSON.parse(localStorage.getItem('minesweeper_sync_queue')!)
    expect(queue).toHaveLength(0)
  })
})

describe('setupSyncListener', () => {
  it('adds online event listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const cleanup = setupSyncListener()
    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function))
    cleanup()
  })

  it('removes listener on cleanup', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const cleanup = setupSyncListener()
    cleanup()
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function))
  })

  it('processes queue when online event fires', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    enqueue({ method: 'GET', path: '/api/games/1' })
    const cleanup = setupSyncListener()
    window.dispatchEvent(new Event('online'))
    await vi.waitFor(() => {
      const queue = JSON.parse(localStorage.getItem('minesweeper_sync_queue')!)
      expect(queue).toHaveLength(0)
    }, { timeout: 2000, interval: 50 })
    cleanup()
  })
})
