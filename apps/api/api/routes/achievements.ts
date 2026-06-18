import { Router } from 'express'
import { query } from '../utils/supabase'
import { requireAuth, requireNotBanned } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'

const router = Router()

router.get('/', async (_req, res: Response) => {
  try {
    const data = await query(`select * from public.achievements order by key`)
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/me', requireAuth, requireNotBanned, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const all = await query<any>(`select * from public.achievements order by key`)

    const earned = await query<{ achievement_id: string; unlocked_at: string }>(
      `select achievement_id, unlocked_at from public.user_achievements where user_id = $1`,
      [req.userId]
    )

    const earnedSet = new Set(earned.map(e => e.achievement_id))
    const earnedMap = new Map(earned.map(e => [e.achievement_id, e.unlocked_at]))

    const data = all.map(a => ({
      ...a,
      unlocked: earnedSet.has(a.id),
      unlockedAt: earnedMap.get(a.id) ?? null,
    }))

    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
