import express from 'express'
import cors from 'cors'
import gamesRouter from './routes/games'
import leaderboardRouter from './routes/leaderboard'
import statsRouter from './routes/stats'
import achievementsRouter from './routes/achievements'
import adminRouter from './routes/admin'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/games', gamesRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/stats', statsRouter)
app.use('/api/achievements', achievementsRouter)
app.use('/api/admin', adminRouter)

const port = process.env.PORT ?? 3001

app.listen(port, () => {
  console.log(`API running on port ${port}`)
})

export default app
