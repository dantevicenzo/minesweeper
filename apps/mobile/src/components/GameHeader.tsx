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
  const faceIcon = { default: <SmileyIcon />, worried: <WorriedIcon />, won: <GlassesIcon />, lost: <XeyesIcon /> }[face]

  return (
    <View style={[styles.header, { backgroundColor: colors.bgSecondary, borderTopColor: colors.cellBorderDark, borderLeftColor: colors.cellBorderDark, borderBottomColor: colors.cellBorderLight, borderRightColor: colors.cellBorderLight }]}>
      <MineCounter value={mineCount - flagCount} />
      <View style={styles.centerGroup}>
        <Pressable style={[styles.iconBtn, { borderTopColor: colors.cellBorderLight, borderLeftColor: colors.cellBorderLight, borderBottomColor: colors.cellBorderDark, borderRightColor: colors.cellBorderDark }]} onPress={onFlagModeToggle}>
          <FlagIcon color={flagMode ? colors.flag : colors.textSecondary} />
        </Pressable>
        <Pressable onPress={onReset}>{faceIcon}</Pressable>
        <Pressable style={styles.iconBtn} onPress={onOpenLeaderboard}>
          <TrophyIcon color={colors.textSecondary} />
        </Pressable>
      </View>
      <View style={styles.rightGroup}>
        <MineCounter value={time} />
        <Pressable style={styles.iconBtn} onPress={onOpenProfile}>
          <ProfileIcon color={colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onOpenMenu}>
          <GearIcon color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4, borderWidth: 3,
  },
  centerGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 4 },
})
