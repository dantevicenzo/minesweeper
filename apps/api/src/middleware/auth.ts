import type { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? ''

export interface AuthenticatedRequest extends Request {
  userId?: string
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' })
    return
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  req.userId = data.user.id
  next()
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (token) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data } = await supabase.auth.getUser(token)
    if (data.user) {
      req.userId = data.user.id
    }
  }

  next()
}
