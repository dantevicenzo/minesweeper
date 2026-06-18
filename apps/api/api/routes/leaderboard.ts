import { Router } from 'express'
import { query, queryOne } from '../utils/supabase'
import { requireAuth, requireNotBanned } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'

const router = Router()

function buildLeaderboardQuery(difficulty: string, period: string, custom: { where: string; params: any[] }) {
  const params: any[] = [difficulty]

  let idx = 2
  const customWhereSql = custom.where
    .replace(/\$4/g, `$${idx++}`)
    .replace(/\$5/g, `$${idx++}`)
    .replace(/\$6/g, `$${idx++}`)
  if (custom.params.length > 0) params.push(...custom.params)

  let periodSql = ''
  if (period === 'today') {
    periodSql = `and le.created_at >= $${idx++}`
    params.push(new Date(new Date().setHours(0, 0, 0, 0)))
  } else if (period === 'week') {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    periodSql = `and le.created_at >= $${idx++}`
    params.push(weekAgo)
  } else if (period === 'month') {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    periodSql = `and le.created_at >= $${idx++}`
    params.push(monthAgo)
  }

  return { params, customWhereSql, periodSql }
}

function buildCustomFilter(req: { query: Record<string, unknown> }): { where: string; params: any[] } {
  const width = parseInt(req.query.width as string)
  const height = parseInt(req.query.height as string)
  const mineCount = parseInt(req.query.mineCount as string)

  if (!isNaN(width) && !isNaN(height) && !isNaN(mineCount)) {
    return {
      where: 'and g.width = $4 and g.height = $5 and g.mine_count = $6',
      params: [width, height, mineCount],
    }
  }

  return { where: '', params: [] }
}

const GAMES_JOIN = 'left join public.games g on g.id = le.game_id'

router.get('/', async (req, res: Response) => {
  const difficulty = (req.query.difficulty as string) ?? 'easy'
  const period = (req.query.period as string) ?? 'all'
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
  const offset = (page - 1) * limit
  const custom = difficulty === 'custom' ? buildCustomFilter(req) : { where: '', params: [] }
  const q = buildLeaderboardQuery(difficulty, period, custom)

  try {
    const listParams = [...q.params, limit, offset]
    const countParams = [...q.params]

    const data = await query(
      `select le.*, p.display_name, p.avatar_url, g.width, g.height, g.mine_count
       from public.leaderboard_entries le
       join public.profiles p on p.id = le.user_id
       ${GAMES_JOIN}
       where le.difficulty = $1 and p.banned = false ${q.customWhereSql} ${q.periodSql}
       order by le.duration_ms asc
       limit $${q.params.length + 1} offset $${q.params.length + 2}`,
      listParams
    )

    const countResult = await queryOne<{ count: number }>(
      `select count(*)::int as count
       from public.leaderboard_entries le
       join public.profiles p on p.id = le.user_id
       ${GAMES_JOIN}
       where le.difficulty = $1 and p.banned = false ${q.customWhereSql} ${q.periodSql}`,
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
  const custom = difficulty === 'custom' ? buildCustomFilter(req) : { where: '', params: [] }
  const q = buildLeaderboardQuery(difficulty, period, custom)

  try {
    const data = await queryOne<any>(
      `select le.*
       from public.leaderboard_entries le
       ${GAMES_JOIN}
       where le.user_id = $${q.params.length + 1} and le.difficulty = $1 ${q.customWhereSql} ${q.periodSql}
       order by le.duration_ms asc
       limit 1`,
      [...q.params, req.userId!]
    )

    if (!data) {
      res.status(404).json({ error: 'No entries found' })
      return
    }

    const rankResult = await queryOne<{ rank: number }>(
      `select count(*)::int + 1 as rank
       from public.leaderboard_entries le
       join public.profiles p on p.id = le.user_id
       ${GAMES_JOIN}
       where le.difficulty = $1 and le.duration_ms < $${q.params.length + 1} and p.banned = false ${q.customWhereSql} ${q.periodSql}`,
      [...q.params, data.duration_ms]
    )

    res.json({ ...data, rank: rankResult?.rank ?? 1 })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
