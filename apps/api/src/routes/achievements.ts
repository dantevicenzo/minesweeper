import { Router } from 'express'
import { supabase } from '../utils/supabase'
import { requireAuth } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'

const router = Router()

router.get('/', async (_req, res: Response) => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('key')

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!

  const [allResult, earnedResult] = await Promise.all([
    supabase.from('achievements').select('*').order('key'),
    supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId),
  ])

  if (allResult.error) {
    res.status(500).json({ error: allResult.error.message })
    return
  }

  const earned = new Set(earnedResult.data?.map(e => e.achievement_id) ?? [])

  const data = allResult.data.map(a => ({
    ...a,
    unlocked: earned.has(a.id),
    unlockedAt: earnedResult.data?.find(e => e.achievement_id === a.id)?.unlocked_at ?? null,
  }))

  res.json(data)
})

export default router
