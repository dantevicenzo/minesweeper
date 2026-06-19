import { useState } from 'react'
import { View, Text, Pressable, TextInput, StyleSheet, Linking } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useTheme } from '../contexts/ThemeContext'

interface GameMenuProps {
  onClose: () => void
  onStartGame: (difficulty: string, width?: number, height?: number, mineCount?: number) => void
  onNewGame: () => void
  currentDifficulty?: string
}

const DIFFICULTIES = [
  { key: 'easy', width: 9, height: 9, mines: 10 },
  { key: 'medium', width: 16, height: 16, mines: 40 },
  { key: 'hard', width: 30, height: 16, mines: 99 },
] as const

const DIFF_KEYS = ['easy', 'medium', 'hard', 'custom'] as const

export function GameMenu({ onClose, onStartGame, onNewGame, currentDifficulty = 'easy' }: GameMenuProps) {
  const { t, locale, setLocale } = useI18n()
  const { theme, setTheme } = useTheme()
  const { colors } = useTheme()
  const { user, signOut } = useAuth()
  const [difficulty, setDifficulty] = useState(currentDifficulty)
  const [customWidth, setCustomWidth] = useState('12')
  const [customHeight, setCustomHeight] = useState('12')
  const [customMines, setCustomMines] = useState('20')

  const diffLabel = (key: string) => {
    switch (key) {
      case 'easy': return t.game.difficulty.easy
      case 'medium': return t.game.difficulty.medium
      case 'hard': return t.game.difficulty.hard
      default: return key
    }
  }

  const handleDifficulty = (key: string) => {
    setDifficulty(key)
    if (key === 'custom') return
    const diff = DIFFICULTIES.find(d => d.key === key)!
    onStartGame(key, diff.width, diff.height, diff.mines)
    onClose()
  }

  const handleCustomStart = () => {
    const w = parseInt(customWidth, 10) || 12
    const h = parseInt(customHeight, 10) || 12
    const m = parseInt(customMines, 10) || 20
    onStartGame('custom', w, h, m)
    onClose()
  }

  const isSelected = (key: string) => difficulty === key

  return (
    <View style={styles.menu}>
      <Pressable style={[styles.menuBtn, { backgroundColor: colors.primary }]} onPress={() => { onNewGame(); onClose() }}>
        <Text style={styles.menuBtnTextLight}>{t.home.newGame}</Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.leaderboard.difficulty}</Text>
      <View style={styles.difficultyRow}>
        {DIFF_KEYS.map(k => (
          <Pressable
            key={k}
            style={[styles.diffBtn, { backgroundColor: isSelected(k) ? colors.primary : colors.bgSecondary }]}
            onPress={() => handleDifficulty(k)}
          >
            <Text style={[styles.diffBtnText, { color: isSelected(k) ? '#fff' : colors.text }]}>
              {k === 'custom' ? t.game.difficulty.custom : diffLabel(k)}
            </Text>
          </Pressable>
        ))}
      </View>

      {difficulty === 'custom' && (
        <View style={styles.customInputs}>
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.game.customWidth}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              keyboardType="number-pad"
              value={customWidth}
              onChangeText={setCustomWidth}
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.game.customHeight}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              keyboardType="number-pad"
              value={customHeight}
              onChangeText={setCustomHeight}
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t.game.customMines}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              keyboardType="number-pad"
              value={customMines}
              onChangeText={setCustomMines}
            />
          </View>
          <Pressable style={[styles.customStartBtn, { backgroundColor: colors.primary }]} onPress={handleCustomStart}>
            <Text style={styles.customStartBtnText}>▶</Text>
          </Pressable>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.settings.language}</Text>
      <View style={styles.difficultyRow}>
        {(['en', 'pt-BR'] as const).map(l => (
          <Pressable
            key={l}
            style={[styles.diffBtn, { backgroundColor: locale === l ? colors.primary : colors.bgSecondary }]}
            onPress={() => setLocale(l)}
          >
            <Text style={[styles.diffBtnText, { color: locale === l ? '#fff' : colors.text }]}>
              {l === 'en' ? 'English' : 'Português'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.settings.theme}</Text>
      <View style={styles.difficultyRow}>
        {(['light', 'dark'] as const).map(th => (
          <Pressable
            key={th}
            style={[styles.diffBtn, { backgroundColor: theme === th ? colors.primary : colors.bgSecondary }]}
            onPress={() => setTheme(th)}
          >
            <Text style={[styles.diffBtnText, { color: theme === th ? '#fff' : colors.text }]}>
              {th === 'light' ? t.settings.light : t.settings.dark}
            </Text>
          </Pressable>
        ))}
      </View>

      {user && (
        <Pressable style={[styles.menuBtn, { backgroundColor: colors.danger }]} onPress={() => { signOut(); onClose() }}>
          <Text style={styles.menuBtnTextLight}>{t.auth.signOut}</Text>
        </Pressable>
      )}

      <Pressable style={styles.menuBtn} onPress={() => Linking.openURL('https://buymeacoffee.com/dantevicenzo')}>
        <Text style={[styles.menuBtnText, { color: colors.text }]}>{t.home.donate}</Text>
      </Pressable>

      <View style={styles.credits}>
        <Text style={[styles.creditsText, { color: colors.textSecondary }]}>
          {t.credits.developedBy} Dante Vicenzo · {t.credits.year}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  menu: { paddingBottom: 24 },
  menuBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  menuBtnText: { fontSize: 14, fontWeight: '600' },
  menuBtnTextLight: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 8 },
  difficultyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  diffBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  diffBtnText: { fontSize: 13, fontWeight: '500' },
  customInputs: { marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  inputLabel: { fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 14, width: 80, textAlign: 'center' },
  customStartBtn: { padding: 8, borderRadius: 6, alignItems: 'center', marginTop: 4 },
  customStartBtnText: { color: '#fff', fontSize: 16 },
  credits: { marginTop: 16, alignItems: 'center' },
  creditsText: { fontSize: 12 },
})
