'use client'

import { GameBoard } from '../components/GameBoard'

export default function Home() {
  return (
    <main>
      <h1>Minesweeper</h1>
      <GameBoard width={9} height={9} mineCount={10} />
    </main>
  )
}
