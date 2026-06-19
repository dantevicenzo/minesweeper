import { useState, useEffect, useRef, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { useGame } from '@minesweeper/hooks'
import { useAuth } from '../contexts/AuthContext'
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

const CELL = 28
const PAD = 10
const BORDER = 3
const HEADER_H = 42
const WRAPPER_PADDING = 8

export function GameBoard({ width, height, mineCount, difficulty = 'easy', onOpenMenu, onOpenLeaderboard, onOpenProfile }: GameBoardProps) {
  const { user } = useAuth()
  const { colors } = useTheme()
  const { game, dispatch, reset } = useGame(width, height, mineCount)
  const [time, setTime] = useState(0)
  const [face, setFace] = useState<'default' | 'worried' | 'won' | 'lost'>('default')
  const [showResult, setShowResult] = useState(false)
  const [flagMode, setFlagMode] = useState(false)
  const [space, setSpace] = useState({ w: 0, h: 0 })
  const clickCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (game.status === 'playing' && !timerRef.current) {
      timerRef.current = setInterval(() => setTime(prev => prev + 1), 1000)
    }
    if (game.status === 'won' || game.status === 'lost') {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      setShowResult(true)
      setFace(game.status === 'won' ? 'won' : 'lost')
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
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
    if (flagMode) { wrappedDispatch({ type: 'flag', row, col }) }
    else { wrappedDispatch({ type: 'reveal', row, col }) }
  }

  const handleCellLongPress = (row: number, col: number) => {
    const cell = game.board[row][col]
    if (cell.isRevealed && cell.adjacentMines > 0) { wrappedDispatch({ type: 'chord', row, col }) }
    else { wrappedDispatch({ type: 'flag', row, col }) }
  }

  const gridW = width * CELL
  const gridH = height * CELL
  const natW = gridW + PAD * 2 + BORDER * 2
  const natH = HEADER_H + gridH + PAD * 2 + BORDER * 2 + 8

  const availW = (space.w || 390) - WRAPPER_PADDING * 2
  const availH = (space.h || 700) - WRAPPER_PADDING * 2
  const scale = Math.min(availW / natW, availH / natH)
  const scaledW = natW * scale
  const scaledH = natH * scale

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg }]} onLayout={e => setSpace({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <View style={styles.centerArea}>
        <View style={[styles.scaler, { width: scaledW, height: scaledH }]}>
          <View style={{ width: natW, height: natH, transform: [{ scale }], transformOrigin: [0, 0] }}>
            <View style={[styles.container, {
              backgroundColor: colors.cellBg,
              borderTopColor: colors.cellBorderLight, borderLeftColor: colors.cellBorderLight,
              borderBottomColor: colors.cellBorderDark, borderRightColor: colors.cellBorderDark,
            }]}>
              <GameHeader
                mineCount={mineCount} flagCount={game.flagCount} time={time}
                face={face} flagMode={flagMode}
                onFlagModeToggle={() => setFlagMode(f => !f)}
                onReset={wrappedReset}
                onOpenMenu={onOpenMenu ?? (() => {})} onOpenLeaderboard={onOpenLeaderboard ?? (() => {})}
                onOpenProfile={onOpenProfile ?? (() => {})}
              />
              <View style={[styles.grid, {
                width: gridW, height: gridH,
                backgroundColor: colors.cellBorderDark,
                borderTopColor: colors.cellBorderDark, borderLeftColor: colors.cellBorderDark,
                borderBottomColor: colors.cellBorderLight, borderRightColor: colors.cellBorderLight,
              }]}>
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
            </View>
          </View>
        </View>
      </View>
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
  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scaler: { overflow: 'hidden' },
  container: {
    padding: PAD,
    borderWidth: BORDER,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    borderWidth: BORDER,
  },
})
