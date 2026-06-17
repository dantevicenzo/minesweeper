import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@minesweeper/engine',
    '@minesweeper/hooks',
    '@minesweeper/ui',
    '@minesweeper/types',
    '@minesweeper/utils',
  ],
}

export default nextConfig
