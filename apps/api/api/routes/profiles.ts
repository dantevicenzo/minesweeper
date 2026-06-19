import { Router } from 'express'
import { queryOne } from '../utils/supabase'
import { requireAuth, requireNotBanned } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'
import type { Profile } from '@minesweeper/types'

const router = Router()

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
const BANNED_WORDS = ['admin', 'root', 'system', 'null', 'undefined', 'auth', 'api', 'support', 'me', 'mine', 'minesweeper', 'official']

function isBannedWord(username: string): boolean {
  return BANNED_WORDS.includes(username.toLowerCase())
}

function validateUsername(username: string): { valid: boolean; reason?: 'invalid' | 'banned' } {
  if (!USERNAME_REGEX.test(username)) return { valid: false, reason: 'invalid' }
  if (isBannedWord(username)) return { valid: false, reason: 'banned' }
  return { valid: true }
}

const PROFILE_COLUMNS = `id, username, full_name, email, avatar_url, xp, level, banned, created_at, updated_at`

router.get('/me', requireAuth, requireNotBanned, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await queryOne<Profile>(
      `select ${PROFILE_COLUMNS} from public.profiles where id = $1`,
      [req.userId]
    )
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }
    res.json({ profile })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/username-available', requireAuth, requireNotBanned, async (req: AuthenticatedRequest, res: Response) => {
  const username = (req.query.u as string) ?? ''

  const { valid, reason } = validateUsername(username)
  if (!valid) {
    res.json({ available: false, reason })
    return
  }

  try {
    const existing = await queryOne<{ id: string }>(
      `select id from public.profiles where lower(username) = lower($1) limit 1`,
      [username]
    )
    res.json({ available: !existing, reason: existing ? 'taken' : undefined })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/me', requireAuth, requireNotBanned, async (req: AuthenticatedRequest, res: Response) => {
  const { username, full_name } = req.body ?? {}

  if (typeof username !== 'string') {
    res.status(400).json({ error: 'invalid_username' })
    return
  }

  const { valid, reason } = validateUsername(username)
  if (!valid) {
    res.status(400).json({ error: reason === 'banned' ? 'banned_username' : 'invalid_username' })
    return
  }

  if (full_name !== undefined && typeof full_name !== 'string') {
    res.status(400).json({ error: 'invalid_full_name' })
    return
  }

  if (typeof full_name === 'string' && full_name.length > 80) {
    res.status(400).json({ error: 'invalid_full_name' })
    return
  }

  try {
    const existing = await queryOne<{ id: string }>(
      `select id from public.profiles where lower(username) = lower($1) and id <> $2 limit 1`,
      [username, req.userId]
    )
    if (existing) {
      res.status(409).json({ error: 'username_taken' })
      return
    }

    const profile = await queryOne<Profile>(
      `update public.profiles
       set username = $1, full_name = coalesce($2, full_name), updated_at = now()
       where id = $3
       returning ${PROFILE_COLUMNS}`,
      [username, full_name ?? null, req.userId]
    )

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }

    res.json({ profile })
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'username_taken' })
      return
    }
    res.status(500).json({ error: err.message })
  }
})

export default router
