import { Router } from 'express'
import { supabase } from '../utils/supabase'
import { requireAuth } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'

const router = Router()

router.get('/', async (req, res: Response) => {
  const difficulty = (req.query.difficulty as string) ?? 'easy'
  const page = Math.max(1, parseInt(req.query.page as string) ?? 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) ?? 20))
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('leaderboard_entries')
    .select(`
      *,
      profiles!inner(display_name, avatar_url)
    `, { count: 'exact' })
    .eq('difficulty', difficulty)
    .order('duration_ms', { ascending: true })
    .range(offset, offset + limit - 1)

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

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const difficulty = (req.query.difficulty as string) ?? 'easy'

  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select('*')
    .eq('user_id', req.userId)
    .eq('difficulty', difficulty)
    .order('duration_ms', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  if (!data) {
    res.status(404).json({ error: 'No entries found' })
    return
  }

  const { count } = await supabase
    .from('leaderboard_entries')
    .select('*', { count: 'exact', head: true })
    .eq('difficulty', difficulty)
    .lt('duration_ms', data.duration_ms)

  res.json({ ...data, rank: (count ?? 0) + 1 })
})

export default router
