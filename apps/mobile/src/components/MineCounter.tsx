import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

interface MineCounterProps {
  value: number
}

export function MineCounter({ value }: MineCounterProps) {
  const { colors } = useTheme()
  const display = Math.max(-99, Math.min(999, value))
  const str = display < 0 ? `-${Math.abs(display).toString().padStart(2, '0')}` : display.toString().padStart(3, '0')

  return (
    <View style={[styles.container, { backgroundColor: colors.counterBg }]}>
      <Text style={[styles.digit, { color: colors.counterText }]}>{str}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2 },
  digit: { fontFamily: 'Courier New', fontSize: 20, fontWeight: '700', letterSpacing: 2 },
})
