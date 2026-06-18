import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@minesweeper/engine',
    '@minesweeper/hooks',
    '@minesweeper/ui',
    '@minesweeper/types',
    '@minesweeper/utils',
  ],
}

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  telemetry: false,
})
