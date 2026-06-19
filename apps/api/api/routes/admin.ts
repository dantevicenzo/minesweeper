import { Router } from 'express'
import { query, queryOne } from '../utils/supabase'
import { requireAuth } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'

const router = Router()

async function requireAdmin(req: AuthenticatedRequest, res: Response): Promise<boolean> {
  const profile = await queryOne<any>(
    `select is_admin, banned from public.profiles where id = $1`,
    [req.userId!]
  )

  if (!profile?.is_admin) {
    res.status(403).json({ error: 'Admin access required' })
    return false
  }

  if (profile?.banned) {
    res.status(403).json({ error: 'Account is banned' })
    return false
  }

  return true
}

router.get('/users', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = await requireAdmin(req, res)
  if (!isAdmin) return

  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
  const offset = (page - 1) * limit
  const search = req.query.search as string | undefined

  try {
    let sql: string
    let params: any[]
    let countSql: string
    let countParams: any[]

    if (search) {
      sql = `select id, username, full_name, email, xp, level, is_admin, banned, banned_at, created_at, updated_at
             from public.profiles
             where username ilike $1 or email ilike $1 or full_name ilike $1
             order by created_at desc limit $2 offset $3`
      params = [`%${search}%`, limit, offset]
      countSql = `select count(*)::int as count from public.profiles
                  where username ilike $1 or email ilike $1 or full_name ilike $1`
      countParams = [`%${search}%`]
    } else {
      sql = `select id, username, full_name, email, xp, level, is_admin, banned, banned_at, created_at, updated_at
             from public.profiles order by created_at desc limit $1 offset $2`
      params = [limit, offset]
      countSql = `select count(*)::int as count from public.profiles`
      countParams = []
    }

    const data = await query(sql, params)
    const countResult = await queryOne<{ count: number }>(countSql, countParams)

    res.json({
      data,
      pagination: {
        page,
        limit,
        total: countResult?.count ?? 0,
        totalPages: countResult ? Math.ceil(countResult.count / limit) : 0,
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/users/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = await requireAdmin(req, res)
  if (!isAdmin) return

  const { id } = req.params
  const { username, full_name, is_admin, banned } = req.body

  try {
    const setClauses: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (username !== undefined) {
      setClauses.push(`username = $${paramIndex++}`)
      params.push(username)
    }
    if (full_name !== undefined) {
      setClauses.push(`full_name = $${paramIndex++}`)
      params.push(full_name)
    }
    if (is_admin !== undefined) {
      setClauses.push(`is_admin = $${paramIndex++}`)
      params.push(is_admin)
    }
    if (banned !== undefined) {
      setClauses.push(`banned = $${paramIndex++}`)
      setClauses.push(`banned_at = case when $${paramIndex++} then now() else null end`)
      params.push(banned)
      params.push(banned)
    }

    if (setClauses.length === 0) {
      res.status(400).json({ error: 'No fields to update' })
      return
    }

    setClauses.push(`updated_at = now()`)
    params.push(id)

    const data = await queryOne(
      `update public.profiles set ${setClauses.join(', ')} where id = $${paramIndex} returning *`,
      params
    )

    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = await requireAdmin(req, res)
  if (!isAdmin) return

  try {
    const totalUsers = await queryOne<{ count: number }>(
      `select count(*)::int as count from public.profiles`
    )

    const gameStats = await queryOne<any>(
      `select
         count(*)::int as total_games,
         count(*) filter (where status = 'won')::int as won_games,
         count(*) filter (where status = 'lost')::int as lost_games
       from public.games`
    )

    const gamesByDifficulty = await query<{ difficulty: string; count: number }>(
      `select difficulty, count(*)::int as count from public.games group by difficulty`
    )

    const topPlayers = await query<{ username: string; xp: number }>(
      `select username, xp from public.profiles where banned = false order by xp desc limit 10`
    )

    const total = gameStats?.total_games ?? 0

    res.json({
      totalUsers: totalUsers?.count ?? 0,
      totalGames: total,
      wonGames: gameStats?.won_games ?? 0,
      lostGames: gameStats?.lost_games ?? 0,
      winRate: total > 0 ? Math.round(((gameStats?.won_games ?? 0) / total) * 100) : 0,
      gamesByDifficulty: Object.fromEntries(gamesByDifficulty.map(g => [g.difficulty, g.count])),
      topPlayers,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
