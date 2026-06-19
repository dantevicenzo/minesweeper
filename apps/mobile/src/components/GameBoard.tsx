import { useState, useEffect, useRef, useCallback } from 'react'
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native'
import { useGame } from '@minesweeper/hooks'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useTheme } from '../contexts/ThemeContext'
import { GameHeader } from './GameHeader'
import { CellView } from './CellView'
import { ResultModal } from './ResultModal'
import type { GameAction } from '@minesweeper/engine'

interface GameBoardProps {
  width: number
  height: number
  mineCount: number
  difficulty?: string
  onOpenMenu?: () => void
  onOpenLeaderboard?: () => void
  onOpenProfile?: () => void
}

export function GameBoard({ width, height, mineCount, difficulty = 'easy', onOpenMenu, onOpenLeaderboard, onOpenProfile }: GameBoardProps) {
  const { user } = useAuth()
  const { colors } = useTheme()
  const { game, dispatch, reset } = useGame(width, height, mineCount)
  const [time, setTime] = useState(0)
  const [face, setFace] = useState<'default' | 'worried' | 'won' | 'lost'>('default')
  const [showResult, setShowResult] = useState(false)
  const [flagMode, setFlagMode] = useState(false)
  const clickCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (game.status === 'playing' && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1)
      }, 1000)
    }
    if (game.status === 'won' || game.status === 'lost') {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      setShowResult(true)
      setFace(game.status === 'won' ? 'won' : 'lost')
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [game.status])

  const wrappedDispatch = useCallback((action: GameAction) => {
    clickCountRef.current += 1
    dispatch(action)
  }, [dispatch])

  const wrappedReset = useCallback(() => {
    clickCountRef.current = 0
    setTime(0)
    setShowResult(false)
    setFace('default')
    reset()
  }, [reset])

  const xpMap: Record<string, number> = { easy: 100, medium: 150, hard: 200 }
  const xpEarned = user && game.status === 'won' ? (xpMap[difficulty] ?? 100) : undefined

  const handleCellPress = (row: number, col: number) => {
    if (flagMode) {
      wrappedDispatch({ type: 'flag', row, col })
    } else {
      wrappedDispatch({ type: 'reveal', row, col })
    }
  }

  const handleCellLongPress = (row: number, col: number) => {
    const cell = game.board[row][col]
    if (cell.isRevealed && cell.adjacentMines > 0) {
      wrappedDispatch({ type: 'chord', row, col })
    } else {
      wrappedDispatch({ type: 'flag', row, col })
    }
  }

  const { width: screenWidth } = Dimensions.get('window')
  const cellSize = 28
  const boardWidth = width * cellSize
  const scale = Math.min(1, (screenWidth - 16) / boardWidth)

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg }]}>
      <GameHeader
        mineCount={mineCount} flagCount={game.flagCount} time={time}
        face={face} flagMode={flagMode}
        onFlagModeToggle={() => setFlagMode(f => !f)}
        onReset={wrappedReset}
        onOpenMenu={onOpenMenu ?? (() => {})} onOpenLeaderboard={onOpenLeaderboard ?? (() => {})}
        onOpenProfile={onOpenProfile ?? (() => {})}
      />
      <ScrollView horizontal style={styles.scrollContainer}>
        <View style={[styles.grid, { width: boardWidth * scale, height: height * cellSize * scale, transform: [{ scale }] }]}>
          {game.board.map((row, rowIdx) =>
            row.map((_, colIdx) => (
              <CellView
                key={`${rowIdx}-${colIdx}`}
                cell={game.board[rowIdx][colIdx]}
                gameStatus={game.status}
                flagMode={flagMode}
                onPress={() => handleCellPress(rowIdx, colIdx)}
                onLongPress={() => handleCellLongPress(rowIdx, colIdx)}
              />
            ))
          )}
        </View>
      </ScrollView>
      {showResult && (
        <ResultModal
          status={game.status as 'won' | 'lost'}
          time={time} difficulty={difficulty}
          mineCount={mineCount} flagCount={game.flagCount}
          clickCount={clickCountRef.current}
          width={width} height={height}
          xpEarned={xpEarned}
          onPlayAgain={wrappedReset}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scrollContainer: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
})
