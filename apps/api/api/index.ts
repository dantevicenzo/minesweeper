import express from 'express'
import cors from 'cors'
import * as Sentry from '@sentry/node'
import { expressIntegration, setupExpressErrorHandler } from '@sentry/node'
import gamesRouter from './routes/games'
import leaderboardRouter from './routes/leaderboard'
import statsRouter from './routes/stats'
import achievementsRouter from './routes/achievements'
import adminRouter from './routes/admin'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [expressIntegration()],
  tracesSampleRate: 0.1,
})

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req: import('express').Request, res: import('express').Response) => {
  res.json({ status: 'ok' })
})

app.use('/api/games', gamesRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/stats', statsRouter)
app.use('/api/achievements', achievementsRouter)
app.use('/api/admin', adminRouter)

setupExpressErrorHandler(app)

const port = process.env.PORT ?? 3001

const shouldListen = !(process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VERCEL === '1')
if (shouldListen) {
  app.listen(port, () => {
    console.log(`API running on port ${port}`)
  })
}

export default app
