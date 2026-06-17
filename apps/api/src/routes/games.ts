import { Router } from 'express'
import { supabase } from '../utils/supabase'
import { requireAuth, optionalAuth } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'

const router: Router = Router()

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { width, height, mineCount, difficulty, state } = req.body

  if (!width || !height || !mineCount) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  const { data, error } = await supabase
    .from('games')
    .insert({
      user_id: req.userId,
      width,
      height,
      mine_count: mineCount,
      difficulty,
      state,
    })
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.status(201).json(data)
})

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status as string | undefined

  let query = supabase
    .from('games')
    .select('*')
    .eq('user_id', req.userId)
    .order('updated_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data)
})

router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  if (!data) {
    res.status(404).json({ error: 'Game not found' })
    return
  }

  if (data.user_id && data.user_id !== req.userId) {
    res.status(403).json({ error: 'Not authorized' })
    return
  }

  res.json(data)
})

router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const { state, status, completed_at, duration_ms } = req.body

  const update: Record<string, unknown> = {}
  if (state !== undefined) update.state = state
  if (status !== undefined) update.status = status
  if (completed_at !== undefined) update.completed_at = completed_at
  if (duration_ms !== undefined) update.duration_ms = duration_ms
  update.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('games')
    .update(update)
    .eq('id', id)
    .eq('user_id', req.userId)
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  if (!data) {
    res.status(404).json({ error: 'Game not found or not authorized' })
    return
  }

  res.json(data)
})

router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params

  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', id)
    .eq('user_id', req.userId)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.status(204).send()
})

export default router
