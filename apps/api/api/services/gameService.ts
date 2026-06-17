import { query, queryOne } from '../utils/supabase'

interface GameResult {
  id: string
  userId: string
  difficulty: string
  durationMs: number
  status: string
  flaggedCells: number
}

const XP_BY_DIFFICULTY: Record<string, number> = {
  easy: 100,
  medium: 150,
  hard: 200,
}

function calcLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

function calcLevelInv(level: number): number {
  return (level - 1) ** 2 * 100
}

export async function processGameCompletion(game: GameResult): Promise<void> {
  if (game.status !== 'won') return

  const winCountResult = await queryOne<{ count: number }>(
    `select count(*)::int as count
     from public.games
     where user_id = $1 and status = 'won'`,
    [game.userId]
  )

  const recentGames = await query<{ status: string }>(
    `select status from public.games
     where user_id = $1 and completed_at is not null
     order by completed_at desc
     limit 50`,
    [game.userId]
  )

  let streak = 0
  for (const g of recentGames) {
    if (g.status === 'won') streak++
    else break
  }

  const winCount = (winCountResult?.count ?? 0)
  const baseXp = XP_BY_DIFFICULTY[game.difficulty] ?? 100
  const streakBonus = Math.min(streak - 1, 10) * 10
  const totalXp = baseXp + streakBonus

  await query(
    `insert into public.xp_events (user_id, amount, reason, metadata)
     values ($1, $2, $3, $4)`,
    [game.userId, totalXp, 'game_won', JSON.stringify({
      difficulty: game.difficulty,
      base_xp: baseXp,
      streak_bonus: streakBonus,
      streak,
      duration_ms: game.durationMs,
    })]
  )

  await query(
    `update public.profiles set xp = xp + $1, level = $2, updated_at = now()
     where id = $3`,
    [
      totalXp,
      calcLevel(((await queryOne<{ xp: number }>('select xp from public.profiles where id = $1', [game.userId]))?.xp ?? 0) + totalXp),
      game.userId,
    ]
  )

  const profile = await queryOne<{ xp: number }>('select xp from public.profiles where id = $1', [game.userId])
  const currentXp = profile?.xp ?? 0

  await checkAndUnlockAchievements(game, winCount + 1, streak, currentXp)
}

async function checkAndUnlockAchievements(
  game: GameResult,
  winCount: number,
  winStreak: number,
  currentXp: number,
): Promise<void> {
  const allAchievements = await query<{
    id: string
    key: string
    criteria: Record<string, unknown>
  }>(`select * from public.achievements`)

  const unlocked = await query<{ achievement_id: string }>(
    `select achievement_id from public.user_achievements where user_id = $1`,
    [game.userId]
  )

  const unlockedSet = new Set(unlocked.map(u => u.achievement_id))

  for (const a of allAchievements) {
    if (unlockedSet.has(a.id)) continue

    let earned = false

    switch (a.key) {
      case 'first_win':
        earned = winCount >= 1
        break
      case 'speed_demon':
        earned = game.difficulty === 'easy' && game.durationMs <= 30000
        break
      case 'win_streak_5':
        earned = winStreak >= 5
        break
      case 'explorer':
        earned = winCount >= 50
        break
      case 'expert_win':
        earned = game.difficulty === 'hard'
        break
      case 'perfect_game':
        earned = game.flaggedCells === 0
        break
      case 'level_10':
        earned = currentXp >= calcLevelInv(10)
        break
      case 'social_player':
        break
    }

    if (earned) {
      await query(
        `insert into public.user_achievements (user_id, achievement_id)
         values ($1, $2)
         on conflict do nothing`,
        [game.userId, a.id]
      )

      await query(
        `insert into public.xp_events (user_id, amount, reason, metadata)
         values ($1, $2, $3, $4)`,
        [game.userId, 50, 'achievement', JSON.stringify({ achievement_id: a.id })]
      )

      await query(
        `update public.profiles set xp = xp + $1, level = $2, updated_at = now()
         where id = $3`,
        [50, calcLevel(currentXp + 50), game.userId]
      )
    }
  }
}
