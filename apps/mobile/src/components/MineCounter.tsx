import { View, StyleSheet } from 'react-native'
import { TimerDigit } from './icons/TimerDigit'
import { useTheme } from '../contexts/ThemeContext'

interface MineCounterProps {
  value: number
}

export function MineCounter({ value }: MineCounterProps) {
  const { colors } = useTheme()
  const clamped = Math.max(-99, Math.min(999, value))
  const isNegative = clamped < 0
  const absStr = Math.abs(clamped).toString().padStart(3, '0')
  const digits = absStr.split('').map(Number)

  return (
    <View style={[styles.container, { backgroundColor: colors.counterBg, borderColor: colors.cellBorderDark }]}>
      {isNegative ? (
        <View style={styles.minus}>
          <View style={[styles.minusLine, { backgroundColor: colors.counterText }]} />
        </View>
      ) : (
        <TimerDigit digit={digits[0]} color={colors.counterText} />
      )}
      <TimerDigit digit={digits[1]} color={colors.counterText} />
      <TimerDigit digit={digits[2]} color={colors.counterText} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderWidth: 1,
    alignItems: 'center',
  },
  minus: { width: 10, height: 18, justifyContent: 'center', alignItems: 'center' },
  minusLine: { width: 7, height: 2 },
})
