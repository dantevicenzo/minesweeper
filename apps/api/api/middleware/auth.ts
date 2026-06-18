import type { Request, NextFunction } from 'express'
import { queryOne } from '../utils/supabase'

const authUrl = `${process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'}/auth/v1`
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''

export interface AuthenticatedRequest extends Request {
  userId?: string
}

async function getUserFromToken(token: string): Promise<{ id: string } | null> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    if (anonKey) headers['apikey'] = anonKey
    const resp = await fetch(`${authUrl}/user`, { headers })
    if (!resp.ok) return null
    const user = await resp.json() as { id: string }
    return user
  } catch {
    return null
  }
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: import('express').Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' })
    return
  }

  const user = await getUserFromToken(token)
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  req.userId = user.id
  next()
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: import('express').Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (token) {
    const user = await getUserFromToken(token)
    if (user) {
      req.userId = user.id
    }
  }

  next()
}

export async function requireNotBanned(
  req: AuthenticatedRequest,
  res: import('express').Response,
  next: NextFunction
): Promise<void> {
  if (!req.userId) {
    next()
    return
  }

  const profile = await queryOne<{ banned: boolean }>(
    `select banned from public.profiles where id = $1`,
    [req.userId]
  )

  if (profile?.banned) {
    res.status(403).json({ error: 'Account is banned' })
    return
  }

  next()
}
