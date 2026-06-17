const QUEUE_KEY = 'minesweeper_sync_queue'

interface SyncOperation {
  id: string
  method: string
  path: string
  body?: unknown
  createdAt: number
}

let processing = false

function getQueue(): SyncOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(queue: SyncOperation[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {}
}

export function enqueue(op: Omit<SyncOperation, 'id' | 'createdAt'>): void {
  const queue = getQueue()
  queue.push({ ...op, id: crypto.randomUUID(), createdAt: Date.now() })
  saveQueue(queue)
}

export function clearQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY)
  } catch {}
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export async function processQueue(): Promise<void> {
  if (processing) return
  processing = true

  const queue = getQueue()
  if (queue.length === 0) {
    processing = false
    return
  }

  const remaining: SyncOperation[] = []

  for (const op of queue) {
    try {
      const token = localStorage.getItem('sb-access-token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}${op.path}`, {
        method: op.method,
        headers,
        body: op.body ? JSON.stringify(op.body) : undefined,
      })

      if (!res.ok) {
        remaining.push(op)
      }
    } catch {
      remaining.push(op)
    }
  }

  saveQueue(remaining)
  processing = false
}

export function setupSyncListener(): () => void {
  const handler = () => {
    if (navigator.onLine) {
      processQueue()
    }
  }

  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}
