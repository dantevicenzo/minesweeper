'use client'

import Link from 'next/link'
import { GameBoard } from '../../components/GameBoard'
import { useI18n } from '../../contexts/I18nContext'

export default function GamePage() {
  const { t } = useI18n()

  return (
    <main>
      <Link href="/">{t.game.back}</Link>
      <GameBoard width={9} height={9} mineCount={10} />
    </main>
  )
}
