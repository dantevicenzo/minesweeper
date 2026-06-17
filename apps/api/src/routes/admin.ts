import { Router } from 'express'
import { supabase } from '../utils/supabase'
import { requireAuth } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'

const router = Router()

async function requireAdmin(req: AuthenticatedRequest, res: Response): Promise<boolean> {
  const userId = req.userId!
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (!data?.is_admin) {
    res.status(403).json({ error: 'Admin access required' })
    return false
  }
  return true
}

router.get('/users', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = await requireAdmin(req, res)
  if (!isAdmin) return

  const page = Math.max(1, parseInt(req.query.page as string) ?? 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) ?? 20))
  const offset = (page - 1) * limit
  const search = req.query.search as string | undefined

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.ilike('display_name', `%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: count ? Math.ceil(count / limit) : 0,
    },
  })
})

router.put('/users/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = await requireAdmin(req, res)
  if (!isAdmin) return

  const { id } = req.params
  const { display_name, is_admin } = req.body

  const update: Record<string, unknown> = {}
  if (display_name !== undefined) update.display_name = display_name
  if (is_admin !== undefined) update.is_admin = is_admin
  update.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = await requireAdmin(req, res)
  if (!isAdmin) return

  const [usersResult, gamesResult, profilesResult] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('games').select('status, difficulty'),
    supabase
      .from('profiles')
      .select('xp')
      .order('xp', { ascending: false })
      .limit(10),
  ])

  const games = gamesResult.data ?? []
  const won = games.filter(g => g.status === 'won').length
  const lost = games.filter(g => g.status === 'lost').length

  const difficultyCounts: Record<string, number> = {}
  for (const g of games) {
    difficultyCounts[g.difficulty] = (difficultyCounts[g.difficulty] ?? 0) + 1
  }

  res.json({
    totalUsers: usersResult.count ?? 0,
    totalGames: games.length,
    wonGames: won,
    lostGames: lost,
    winRate: games.length > 0 ? Math.round((won / games.length) * 100) : 0,
    gamesByDifficulty: difficultyCounts,
    topPlayers: (profilesResult.data ?? []).map(p => ({
      xp: p.xp,
    })),
  })
})

export default router
