import { Pressable, StyleSheet } from 'react-native'
import { FlagIcon } from './icons/FlagIcon'
import { MineIcon } from './icons/MineIcon'
import { NumberIcon } from './icons/NumberIcon'
import { useTheme } from '../contexts/ThemeContext'
import type { Cell } from '@minesweeper/engine'

interface CellViewProps {
  cell: Cell
  gameStatus: string
  flagMode?: boolean
  onPress: () => void
  onLongPress: () => void
}

export function CellView({ cell, gameStatus, flagMode, onPress, onLongPress }: CellViewProps) {
  const { colors } = useTheme()

  const handlePress = () => {
    if (cell.isRevealed && cell.adjacentMines > 0) {
      onLongPress()
    } else if (flagMode && !cell.isRevealed) {
      onLongPress()
    } else {
      onPress()
    }
  }

  const hidden = !cell.isRevealed
  const revealed = cell.isRevealed && !cell.isExploded
  const exploded = cell.isExploded

  const cellStyle: any[] = [styles.cell]

  if (hidden) {
    cellStyle.push({
      backgroundColor: colors.cellBg,
      borderTopWidth: 3, borderLeftWidth: 3,
      borderBottomWidth: 3, borderRightWidth: 3,
      borderTopColor: colors.cellBorderLight,
      borderLeftColor: colors.cellBorderLight,
      borderBottomColor: colors.cellBorderDark,
      borderRightColor: colors.cellBorderDark,
    })
  } else if (revealed) {
    cellStyle.push({
      backgroundColor: colors.cellRevealed,
      borderTopWidth: 1, borderLeftWidth: 1,
      borderBottomWidth: 1, borderRightWidth: 1,
      borderTopColor: colors.cellBorderDark,
      borderLeftColor: colors.cellBorderDark,
      borderBottomColor: colors.cellBorderLight,
      borderRightColor: colors.cellBorderLight,
    })
  } else if (exploded) {
    cellStyle.push({
      backgroundColor: colors.cellMineExploded,
      borderTopWidth: 1, borderLeftWidth: 1,
      borderBottomWidth: 1, borderRightWidth: 1,
      borderTopColor: colors.cellBorderDark,
      borderLeftColor: colors.cellBorderDark,
      borderBottomColor: colors.cellBorderLight,
      borderRightColor: colors.cellBorderLight,
    })
  }

  return (
    <Pressable
      style={cellStyle}
      onPress={handlePress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={cell.isRevealed ? `Cell ${cell.adjacentMines}` : cell.isFlagged ? 'Flagged' : 'Hidden'}
    >
      {cell.isRevealed && cell.hasMine && <MineIcon />}
      {cell.isRevealed && !cell.hasMine && cell.adjacentMines > 0 && (
        <NumberIcon number={cell.adjacentMines as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8} color={colors.number[cell.adjacentMines] ?? colors.text} />
      )}
      {!cell.isRevealed && cell.isFlagged && <FlagIcon testID="FlagIcon" />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  cell: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
