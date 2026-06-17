import { Router } from 'express'
import { query, queryOne } from '../utils/supabase'
import { requireAuth, optionalAuth } from '../middleware/auth'
import { processGameCompletion } from '../services/gameService'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Response } from 'express'

const router: Router = Router()

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { width, height, mineCount, difficulty, state, status, completed_at, duration_ms } = req.body

  if (!width || !height || !mineCount) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  try {
    const data = await queryOne(
      `insert into public.games (user_id, width, height, mine_count, difficulty, state, status, completed_at, duration_ms)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning *`,
      [
        req.userId, width, height, mineCount, difficulty,
        JSON.stringify(state),
        status ?? 'in_progress',
        completed_at ?? null,
        duration_ms ?? null,
      ]
    )

    if (status === 'won') {
      await query(
        `insert into public.leaderboard_entries (user_id, game_id, difficulty, duration_ms)
         values ($1, $2, $3, $4)
         on conflict do nothing`,
        [req.userId, (data as any).id, difficulty, duration_ms]
      )

      const board = state?.board ?? []
      const flaggedCells = board
        .flatMap((row: any[]) => row)
        .filter((c: any) => c.isFlagged)
        .length

      await processGameCompletion({
        id: (data as any).id,
        userId: req.userId!,
        difficulty,
        durationMs: duration_ms,
        status: 'won',
        flaggedCells,
      }).catch((err: Error) => console.error('Failed to process game completion:', err))
    }

    res.status(201).json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status as string | undefined

  try {
    let sql = `select * from public.games where user_id = $1 order by updated_at desc`
    const params: any[] = [req.userId]
    if (status) {
      sql = `select * from public.games where user_id = $1 and status = $2 order by updated_at desc`
      params.push(status)
    }
    const data = await query(sql, params)
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params

  try {
    const data = await queryOne(`select * from public.games where id = $1`, [id])
    if (!data) {
      res.status(404).json({ error: 'Game not found' })
      return
    }

    const game = data as any
    if (game.user_id && game.user_id !== req.userId) {
      res.status(403).json({ error: 'Not authorized' })
      return
    }

    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const { state, status, completed_at, duration_ms } = req.body

  try {
    const existing = await queryOne<any>(
      `select * from public.games where id = $1 and user_id = $2`,
      [id, req.userId]
    )

    if (!existing) {
      res.status(404).json({ error: 'Game not found or not authorized' })
      return
    }

    const data = await queryOne(
      `update public.games set
        state = $1, status = $2, completed_at = $3, duration_ms = $4, updated_at = now()
       where id = $5 and user_id = $6
       returning *`,
      [
        state ? JSON.stringify(state) : existing.state,
        status ?? existing.status,
        completed_at ?? existing.completed_at,
        duration_ms ?? existing.duration_ms,
        id,
        req.userId,
      ]
    )

    const newStatus = status ?? existing.status
    if (newStatus === 'won' && existing.status !== 'won') {
      await query(
        `insert into public.leaderboard_entries (user_id, game_id, difficulty, duration_ms)
         values ($1, $2, $3, $4)
         on conflict do nothing`,
        [req.userId, id, existing.difficulty, duration_ms ?? existing.duration_ms]
      )

      const board = state?.board ?? existing.state?.board ?? []
      const flaggedCells = board
        .flatMap((row: any[]) => row)
        .filter((c: any) => c.isFlagged)
        .length

      await processGameCompletion({
        id,
        userId: req.userId!,
        difficulty: existing.difficulty,
        durationMs: duration_ms ?? existing.duration_ms,
        status: 'won',
        flaggedCells,
      }).catch((err: Error) => console.error('Failed to process game completion:', err))
    }

    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params

  try {
    await query(`delete from public.games where id = $1 and user_id = $2`, [id, req.userId])
    res.status(204).send()
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
