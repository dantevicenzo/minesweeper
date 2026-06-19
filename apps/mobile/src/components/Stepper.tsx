import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

interface StepperProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  testID?: string
}

export function Stepper({ value, min, max, onChange, testID }: StepperProps) {
  const { colors } = useTheme()

  const canDecrement = value > min
  const canIncrement = value < max

  const btnBase = {
    width: 28,
    height: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
  }

  const raised = {
    borderTopColor: colors.cellBorderLight,
    borderLeftColor: colors.cellBorderLight,
    borderBottomColor: colors.cellBorderDark,
    borderRightColor: colors.cellBorderDark,
  }

  const pressed = {
    borderTopColor: colors.cellBorderDark,
    borderLeftColor: colors.cellBorderDark,
    borderBottomColor: colors.cellBorderLight,
    borderRightColor: colors.cellBorderLight,
  }

  return (
    <View style={styles.container} testID={testID}>
      <Pressable
        style={({ pressed: p }) => [btnBase, raised, p && pressed, !canDecrement && styles.disabled]}
        onPress={() => canDecrement && onChange(value - 1)}
        disabled={!canDecrement}
      >
        <Text style={[styles.btnText, { color: canDecrement ? colors.text : colors.textSecondary }]}>−</Text>
      </Pressable>

      <View style={[styles.valueBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.valueText, { color: colors.text }]}>{value}</Text>
      </View>

      <Pressable
        style={({ pressed: p }) => [btnBase, raised, p && pressed, !canIncrement && styles.disabled]}
        onPress={() => canIncrement && onChange(value + 1)}
        disabled={!canIncrement}
      >
        <Text style={[styles.btnText, { color: canIncrement ? colors.text : colors.textSecondary }]}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  btnText: { fontSize: 18, fontWeight: '400' },
  valueBox: {
    width: 44,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  valueText: { fontSize: 14, fontWeight: '500' },
  disabled: { opacity: 0.4 },
})
