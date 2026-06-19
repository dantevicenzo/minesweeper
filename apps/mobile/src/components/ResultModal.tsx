import { View, Text, Pressable, Modal, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { XeyesIcon, GlassesIcon } from './icons'

interface ResultModalProps {
  status: 'won' | 'lost'
  time: number
  difficulty: string
  mineCount: number
  flagCount: number
  clickCount: number
  width: number
  height: number
  xpEarned?: number
  onPlayAgain: () => void
}

export function ResultModal({ status, time, mineCount, flagCount, clickCount, width, height, xpEarned, onPlayAgain }: ResultModalProps) {
  const { colors } = useTheme()
  const { t } = useI18n()

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onPlayAgain}>
      <View style={styles.backdrop}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.emoji}>{status === 'won' ? <GlassesIcon /> : <XeyesIcon />}</View>
          <Text style={[styles.title, { color: colors.text }]}>{status === 'won' ? t.game.win : t.game.lose}</Text>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.game.stats}</Text>
            <StatRow label={t.game.time} value={`${time}s`} />
            <StatRow label={t.game.board} value={`${width}\u00D7${height}`} />
            <StatRow label={t.game.mines} value={`${mineCount}/${flagCount}`} />
            <StatRow label={t.game.clicks} value={`${clickCount}`} />
          </View>

          {xpEarned != null && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.game.xpEarned}</Text>
              <Text style={[styles.xpValue, { color: colors.primary }]}>+{xpEarned}</Text>
            </View>
          )}

          <Pressable style={[styles.btn, { backgroundColor: colors.primary }]} onPress={onPlayAgain}>
            <Text style={styles.btnText}>{t.game.playAgain}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme()
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    borderRadius: 12, padding: 24, minWidth: 220, maxWidth: '90%',
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 32,
  },
  emoji: { marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  section: { marginBottom: 12, width: '100%' },
  sectionTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '600' },
  xpValue: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  btn: { marginTop: 16, width: '100%', padding: 10, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
