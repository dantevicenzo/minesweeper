import { Router } from 'express'
import { supabase } from '../utils/supabase'
import { requireAuth } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'

const router = Router()

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!

  const [gamesResult, profileResult] = await Promise.all([
    supabase
      .from('games')
      .select('status, difficulty, duration_ms')
      .eq('user_id', userId),
    supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single(),
  ])

  if (gamesResult.error) {
    res.status(500).json({ error: gamesResult.error.message })
    return
  }

  const games = gamesResult.data
  const total = games.length
  const won = games.filter(g => g.status === 'won').length
  const lost = games.filter(g => g.status === 'lost').length

  const bestTimes: Record<string, number | null> = { easy: null, medium: null, hard: null }
  for (const g of games) {
    if (g.status === 'won' && g.duration_ms && g.difficulty in bestTimes) {
      const diff = g.difficulty as keyof typeof bestTimes
      if (bestTimes[diff] === null || g.duration_ms < bestTimes[diff]!) {
        bestTimes[diff] = g.duration_ms
      }
    }
  }

  res.json({
    total,
    won,
    lost,
    winRate: total > 0 ? Math.round((won / total) * 100) : 0,
    bestTimes,
    xp: profileResult.data?.xp ?? 0,
    level: profileResult.data?.level ?? 1,
  })
})

router.get('/:userId', async (req, res: Response) => {
  const { userId } = req.params

  const { data: games, error } = await supabase
    .from('games')
    .select('status, difficulty, duration_ms')
    .eq('user_id', userId)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  const total = games?.length ?? 0
  const won = games?.filter(g => g.status === 'won').length ?? 0

  const bestTimes: Record<string, number | null> = { easy: null, medium: null, hard: null }
  for (const g of games ?? []) {
    if (g.status === 'won' && g.duration_ms && g.difficulty in bestTimes) {
      const diff = g.difficulty as keyof typeof bestTimes
      if (bestTimes[diff] === null || g.duration_ms < bestTimes[diff]!) {
        bestTimes[diff] = g.duration_ms
      }
    }
  }

  res.json({
    total,
    won,
    winRate: total > 0 ? Math.round((won / total) * 100) : 0,
    bestTimes,
  })
})

export default router
