import { View, Pressable, StyleSheet } from 'react-native'
import { MineCounter } from './MineCounter'
import { SmileyIcon, GlassesIcon, WorriedIcon, XeyesIcon, FlagIcon, GearIcon, ProfileIcon, TrophyIcon } from './icons'
import { useTheme } from '../contexts/ThemeContext'

interface GameHeaderProps {
  mineCount: number
  flagCount: number
  time: number
  face: 'default' | 'worried' | 'won' | 'lost'
  flagMode: boolean
  onFlagModeToggle: () => void
  onReset: () => void
  onOpenMenu: () => void
  onOpenLeaderboard: () => void
  onOpenProfile: () => void
}

export function GameHeader({ mineCount, flagCount, time, face, flagMode, onFlagModeToggle, onReset, onOpenMenu, onOpenLeaderboard, onOpenProfile }: GameHeaderProps) {
  const { colors } = useTheme()
  const faceIcon = { default: <SmileyIcon width={18} height={18} />, worried: <WorriedIcon width={18} height={18} />, won: <GlassesIcon width={18} height={18} />, lost: <XeyesIcon width={18} height={18} /> }[face]

  const raisedBtn = {
    borderTopWidth: 2, borderLeftWidth: 2,
    borderBottomWidth: 2, borderRightWidth: 2,
    borderTopColor: colors.cellBorderLight,
    borderLeftColor: colors.cellBorderLight,
    borderBottomColor: colors.cellBorderDark,
    borderRightColor: colors.cellBorderDark,
  }

  const flagBtnStyle = flagMode
    ? [raisedBtn, { backgroundColor: '#fca5a5', borderRadius: 3 }]
    : [raisedBtn]

  return (
    <View style={[styles.header, {
      backgroundColor: colors.cellBg,
      borderTopColor: colors.cellBorderDark, borderLeftColor: colors.cellBorderDark,
      borderBottomColor: colors.cellBorderLight, borderRightColor: colors.cellBorderLight,
    }]}>
      <View style={styles.leftGroup}>
        <Pressable style={[styles.btn, ...flagBtnStyle]} onPress={onFlagModeToggle}>
          <FlagIcon width={10} height={14} color={flagMode ? '#000' : colors.flag} />
        </Pressable>
        <Pressable style={[styles.btn, raisedBtn]} onPress={onOpenLeaderboard}>
          <TrophyIcon width={14} height={14} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.centerGroup}>
        <MineCounter value={mineCount - flagCount} />
        <Pressable style={[styles.btn, raisedBtn]} onPress={onReset}>
          {faceIcon}
        </Pressable>
        <MineCounter value={time} />
      </View>

      <View style={styles.rightGroup}>
        <Pressable style={[styles.btn, raisedBtn]} onPress={onOpenProfile}>
          <ProfileIcon width={14} height={14} color={colors.textSecondary} />
        </Pressable>
        <Pressable style={[styles.btn, raisedBtn]} onPress={onOpenMenu}>
          <GearIcon width={12} height={12} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 8,
    borderWidth: 3,
  },
  leftGroup: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  centerGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'flex-end' },
  btn: { width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
})
