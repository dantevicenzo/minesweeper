import { config } from 'dotenv'
import { resolve } from 'path'
import pkg from 'pg'

config({ path: resolve(process.cwd(), '../../.env.local') })

const { Pool } = pkg

async function seed() {
  const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  })

  console.log('Seeding database...')

  await pool.query(`
    insert into public.achievements (key, name_key, description_key, icon, criteria)
    values
      ('first_win',    'achievements.firstWin.name',    'achievements.firstWin.description',    'trophy',  '{"type": "win_count", "value": 1}'),
      ('speed_demon',  'achievements.speedDemon.name',  'achievements.speedDemon.description',  'zap',     '{"type": "win_time", "value": 30, "difficulty": "easy"}'),
      ('win_streak_5', 'achievements.winStreak5.name',  'achievements.winStreak5.description',  'flame',   '{"type": "win_streak", "value": 5}'),
      ('explorer',     'achievements.explorer.name',    'achievements.explorer.description',    'map',     '{"type": "games_played", "value": 50}'),
      ('expert_win',   'achievements.expertWin.name',   'achievements.expertWin.description',   'star',    '{"type": "win_difficulty", "value": "hard"}'),
      ('perfect_game', 'achievements.perfectGame.name', 'achievements.perfectGame.description', 'diamond', '{"type": "no_flags", "value": true}'),
      ('level_10',     'achievements.level10.name',     'achievements.level10.description',     'level-up','{"type": "level", "value": 10}'),
      ('social_player','achievements.socialPlayer.name','achievements.socialPlayer.description','users',   '{"type": "games_multiplayer", "value": 1}')
    on conflict (key) do nothing
  `)
  console.log('Achievements seeded')

  const { rows: proExists } = await pool.query(
    `select id from auth.users where email = 'test@minesweeper.local'`
  )

  if (proExists.length === 0) {
    const adminUrl = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'

    const res = await fetch(`${adminUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY!}`,
      },
      body: JSON.stringify({
        email: 'test@minesweeper.local',
        password: 'test123456',
        email_confirm: true,
        user_metadata: { full_name: 'Player Teste' },
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Failed to create test user:', errBody)
      await pool.end()
      return
    }

    const newUser = await res.json() as { id: string }
    const userId = newUser.id
    console.log('Test user created:', userId)

    await pool.query(
      `update public.profiles set display_name = $1, xp = $2, level = $3 where id = $4`,
      ['Player Teste', 250, 3, userId]
    )
    console.log('Test profile updated with XP/level')

    const { rows: games } = await pool.query(
      `insert into public.games (user_id, width, height, mine_count, difficulty, state, status, completed_at, duration_ms)
       values ($1, 9, 9, 10, 'easy', '{}', 'won', now(), 45000),
              ($1, 16, 16, 40, 'medium', '{}', 'won', now(), 120000)
       returning id, difficulty, duration_ms`,
      [userId]
    )

    if (games.length > 0) {
      for (const game of games) {
        await pool.query(
          `insert into public.leaderboard_entries (user_id, game_id, difficulty, duration_ms)
           values ($1, $2, $3, $4)`,
          [userId, game.id, game.difficulty, game.duration_ms]
        )
      }
      console.log('Leaderboard entries created')
    }

    await pool.query(
      `insert into public.xp_events (user_id, amount, reason, metadata)
       values ($1, 100, 'game_won', '{"difficulty": "easy"}'),
              ($1, 150, 'game_won', '{"difficulty": "medium"}')`,
      [userId]
    )
    console.log('XP events created')

    const { rows: achievements } = await pool.query(
      `select id from public.achievements where key = 'first_win'`
    )
    if (achievements.length > 0) {
      await pool.query(
        `insert into public.user_achievements (user_id, achievement_id)
         values ($1, $2)
         on conflict do nothing`,
        [userId, achievements[0].id]
      )
      console.log('First win achievement unlocked for test user')
    }
  } else {
    console.log('Test user already exists')
  }

  await pool.end()
  console.log('Seed complete')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
