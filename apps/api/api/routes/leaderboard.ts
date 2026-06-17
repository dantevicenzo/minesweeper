import { Router } from 'express'
import { query, queryOne } from '../utils/supabase'
import { requireAuth } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'

const router = Router()

router.get('/', async (req, res: Response) => {
  const difficulty = (req.query.difficulty as string) ?? 'easy'
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
  const offset = (page - 1) * limit

  try {
    const data = await query(
      `select le.*, p.display_name, p.avatar_url
       from public.leaderboard_entries le
       join public.profiles p on p.id = le.user_id
       where le.difficulty = $1
       order by le.duration_ms asc
       limit $2 offset $3`,
      [difficulty, limit, offset]
    )

    const countResult = await queryOne<{ count: number }>(
      `select count(*)::int as count from public.leaderboard_entries where difficulty = $1`,
      [difficulty]
    )

    const total = countResult?.count ?? 0

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const difficulty = (req.query.difficulty as string) ?? 'easy'

  try {
    const data = await queryOne<any>(
      `select * from public.leaderboard_entries
       where user_id = $1 and difficulty = $2
       order by duration_ms asc
       limit 1`,
      [req.userId, difficulty]
    )

    if (!data) {
      res.status(404).json({ error: 'No entries found' })
      return
    }

    const rankResult = await queryOne<{ rank: number }>(
      `select count(*)::int + 1 as rank
       from public.leaderboard_entries
       where difficulty = $1 and duration_ms < $2`,
      [difficulty, data.duration_ms]
    )

    res.json({ ...data, rank: rankResult?.rank ?? 1 })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
