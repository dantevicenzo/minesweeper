import { Router } from 'express'
import { query, queryOne } from '../utils/supabase'
import { requireAuth, requireNotBanned } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'

const router = Router()

router.get('/me', requireAuth, requireNotBanned, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await queryOne<any>(
      `select * from public.profiles where id = $1`,
      [req.userId]
    )

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }

    const gameStats = await queryOne<any>(
      `select
         count(*)::int as total_games,
         count(*) filter (where status = 'won')::int as wins,
         count(*) filter (where status = 'lost')::int as losses,
         coalesce(avg(duration_ms) filter (where status = 'won'), 0)::int as avg_win_time_ms,
         coalesce(min(duration_ms) filter (where status = 'won'), 0)::int as best_time_ms
       from public.games where user_id = $1`,
      [req.userId]
    )

    const recentGames = await query(
      `select * from public.games where user_id = $1 order by updated_at desc limit 10`,
      [req.userId]
    )

    const xpHistory = await query(
      `select * from public.xp_events where user_id = $1 order by created_at desc limit 20`,
      [req.userId]
    )

    res.json({
      profile,
      games: gameStats,
      recentGames,
      xpHistory,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:userId', async (req, res: Response) => {
  const { userId } = req.params

  try {
    const profile = await queryOne<any>(
      `select id, username, full_name, avatar_url, xp, level from public.profiles where id = $1`,
      [userId]
    )

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }

    const gameStats = await queryOne<any>(
      `select
         count(*)::int as total_games,
         count(*) filter (where status = 'won')::int as wins,
         count(*) filter (where status = 'lost')::int as losses,
         coalesce(avg(duration_ms) filter (where status = 'won'), 0)::int as avg_win_time_ms,
         coalesce(min(duration_ms) filter (where status = 'won'), 0)::int as best_time_ms
       from public.games where user_id = $1 and status != 'in_progress'`,
      [userId]
    )

    res.json({ profile, games: gameStats })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
