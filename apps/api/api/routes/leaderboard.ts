import { Router } from 'express'
import { query, queryOne } from '../utils/supabase'
import { requireAuth, requireNotBanned } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'

const router = Router()

function getPeriodFilter(period: string): { sql: string; since: Date | null } {
  switch (period) {
    case 'today':
      return { sql: 'and le.created_at >= $5', since: new Date(new Date().setHours(0, 0, 0, 0)) }
    case 'week':
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return { sql: 'and le.created_at >= $5', since: weekAgo }
    case 'month':
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return { sql: 'and le.created_at >= $5', since: monthAgo }
    default:
      return { sql: '', since: null }
  }
}

router.get('/', async (req, res: Response) => {
  const difficulty = (req.query.difficulty as string) ?? 'easy'
  const period = (req.query.period as string) ?? 'all'
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
  const offset = (page - 1) * limit
  const { sql: periodSql, since } = getPeriodFilter(period)

  try {
    const params: any[] = [difficulty, limit, offset]
    const countParams: any[] = [difficulty]
    if (since) {
      params.push(since)
      countParams.push(since)
    }

    const data = await query(
      `select le.*, p.display_name, p.avatar_url
       from public.leaderboard_entries le
       join public.profiles p on p.id = le.user_id
       where le.difficulty = $1 and p.banned = false ${periodSql}
       order by le.duration_ms asc
       limit $2 offset $3`,
      params
    )

    const countResult = await queryOne<{ count: number }>(
      `select count(*)::int as count
       from public.leaderboard_entries le
       join public.profiles p on p.id = le.user_id
       where le.difficulty = $1 and p.banned = false ${periodSql}`,
      countParams
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

router.get('/me', requireAuth, requireNotBanned, async (req: AuthenticatedRequest, res: Response) => {
  const difficulty = (req.query.difficulty as string) ?? 'easy'
  const period = (req.query.period as string) ?? 'all'
  const { sql: periodSql, since } = getPeriodFilter(period)

  try {
    const params: any[] = [req.userId!, difficulty]
    const rankParams: any[] = [difficulty]

    if (since) {
      params.push(since)
      rankParams.push(since)
    }

    const data = await queryOne<any>(
      `select * from public.leaderboard_entries
       where user_id = $1 and difficulty = $2 ${periodSql}
       order by duration_ms asc
       limit 1`,
      params
    )

    if (!data) {
      res.status(404).json({ error: 'No entries found' })
      return
    }

    const rankResult = await queryOne<{ rank: number }>(
      `select count(*)::int + 1 as rank
       from public.leaderboard_entries le
       join public.profiles p on p.id = le.user_id
       where le.difficulty = $1 and le.duration_ms < $2 and p.banned = false ${periodSql}`,
      [difficulty, data.duration_ms, ...(since ? [since] : [])]
    )

    res.json({ ...data, rank: rankResult?.rank ?? 1 })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
