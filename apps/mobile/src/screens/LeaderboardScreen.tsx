import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

const DIFFICULTIES = ['easy', 'medium', 'hard', 'custom'] as const
const PERIODS = ['all', 'today', 'week', 'month'] as const
const MIN_SIZE = 5
const MAX_SIZE = 100

interface LeaderboardEntry {
  id: string
  user_id: string
  duration_ms: number
  difficulty: string
  created_at: string
  username: string
  full_name: string | null
  avatar_url: string | null
  width: number
  height: number
  mine_count: number
}

interface MyEntry {
  id: string
  duration_ms: number
  rank: number
  username: string
}

function formatTime(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString()
}

export function LeaderboardScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const { user } = useAuth()
  const [difficulty, setDifficulty] = useState<string>('easy')
  const [period, setPeriod] = useState<string>('all')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [myEntry, setMyEntry] = useState<MyEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [customWidth, setCustomWidth] = useState(12)
  const [customHeight, setCustomHeight] = useState(12)
  const [customMines, setCustomMines] = useState(20)
  const maxMines = customWidth * customHeight - 1
  const isCustom = difficulty === 'custom'

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    setMyEntry(null)

    const customConfig = isCustom
      ? { width: customWidth, height: customHeight, mineCount: customMines }
      : undefined

    try {
      const [listData, myData] = await Promise.all([
        api.leaderboard.list(difficulty, 1, 50, period, customConfig),
        user
          ? api.leaderboard.me(difficulty, period, customConfig).catch(() => null)
          : Promise.resolve(null),
      ])

      setEntries((listData.data ?? []) as LeaderboardEntry[])
      if (myData) setMyEntry(myData as unknown as MyEntry)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [difficulty, period, user, isCustom, customWidth, customHeight, customMines])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const difficultyLabel = (key: string) => {
    const map: Record<string, string> = {
      easy: t.game.difficulty.easy,
      medium: t.game.difficulty.medium,
      hard: t.game.difficulty.hard,
      custom: t.game.difficulty.custom,
    }
    return map[key] ?? key
  }

  const periodLabel = (key: string) => {
    const map: Record<string, string> = {
      all: t.leaderboard.allTime,
      today: t.leaderboard.today,
      week: t.leaderboard.week,
      month: t.leaderboard.month,
    }
    return map[key] ?? key
  }

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = index + 1
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
    const isMe = user && myEntry?.username === item.username

    return (
      <View style={[styles.row, isMe && { backgroundColor: `${colors.primary}26` }]}>
        <Text style={[styles.rankCell, { color: colors.text }]}>
          {medal ?? `#${rank}`}
        </Text>
        <Text style={[styles.playerCell, { color: isMe ? colors.primary : colors.text, fontWeight: isMe ? '600' : '400' }]}>
          {item.username}
        </Text>
        <Text style={[styles.timeCell, { color: colors.text }]}>
          {formatTime(item.duration_ms)}
        </Text>
        <Text style={[styles.dateCell, { color: colors.textSecondary }]}>
          {formatDate(item.created_at)}
        </Text>
      </View>
    )
  }

  const showBoardInfo = entries[0]?.width && entries[0]?.height && entries[0]?.mine_count
  const showMyPosition = myEntry && !entries.some(e => e.id === myEntry.id)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <View style={styles.filterRow}>
        {DIFFICULTIES.map(d => (
          <TouchableOpacity
            key={d}
            style={[
              styles.filterBtn,
              {
                backgroundColor: difficulty === d ? colors.primary : colors.surface,
                borderColor: difficulty === d ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={{ color: difficulty === d ? '#fff' : colors.text, fontSize: 12, fontWeight: '500' }}>
              {difficultyLabel(d)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p}
            style={[
              styles.filterBtn,
              {
                backgroundColor: period === p ? colors.primary : colors.surface,
                borderColor: period === p ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setPeriod(p)}
          >
            <Text style={{ color: period === p ? '#fff' : colors.text, fontSize: 12, fontWeight: '500' }}>
              {periodLabel(p)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isCustom && (
        <View style={styles.customRow}>
          <View style={styles.customItem}>
            <Text style={[styles.customLabel, { color: colors.textSecondary }]}>{t.game.customWidth}</Text>
            <TextInput
              style={[styles.customInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={String(customWidth)}
              onChangeText={v => setCustomWidth(Math.max(MIN_SIZE, Math.min(MAX_SIZE, Number(v) || MIN_SIZE)))}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.customItem}>
            <Text style={[styles.customLabel, { color: colors.textSecondary }]}>{t.game.customHeight}</Text>
            <TextInput
              style={[styles.customInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={String(customHeight)}
              onChangeText={v => setCustomHeight(Math.max(MIN_SIZE, Math.min(MAX_SIZE, Number(v) || MIN_SIZE)))}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.customItem}>
            <Text style={[styles.customLabel, { color: colors.textSecondary }]}>{t.game.customMines}</Text>
            <TextInput
              style={[styles.customInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={String(customMines)}
              onChangeText={v => setCustomMines(Math.max(1, Math.min(maxMines, Number(v) || 1)))}
              keyboardType="numeric"
            />
          </View>
        </View>
      )}

      {showBoardInfo && (
        <Text style={[styles.boardInfo, { color: colors.textSecondary }]}>
          {entries[0].width} × {entries[0].height} · {entries[0].mine_count} {t.game.mines.toLowerCase()}
        </Text>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} testID="loading-indicator" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.danger }}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetchEntries}>
            <Text style={{ color: '#fff' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>{t.leaderboard.noEntries}</Text>
        </View>
      ) : (
        <>
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rankCell, { color: colors.textSecondary, fontWeight: '600' }]}>{t.leaderboard.rank}</Text>
            <Text style={[styles.playerCell, { color: colors.textSecondary, fontWeight: '600' }]}>{t.leaderboard.player}</Text>
            <Text style={[styles.timeCell, { color: colors.textSecondary, fontWeight: '600' }]}>{t.leaderboard.time}</Text>
            <Text style={[styles.dateCell, { color: colors.textSecondary, fontWeight: '600' }]}>{t.leaderboard.date}</Text>
          </View>
          <FlatList
            data={entries}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            ListFooterComponent={showMyPosition ? (
              <View style={[styles.myPosition, { backgroundColor: `${colors.primary}26`, borderColor: colors.primary }]}>
                <Text style={{ color: colors.text, fontSize: 14 }}>
                  {t.leaderboard.yourPosition}: #{myEntry!.rank}
                  {' — '}
                  {formatTime(myEntry!.duration_ms)}
                </Text>
              </View>
            ) : null}
          />
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  customRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  customItem: { flex: 1 },
  customLabel: { fontSize: 12, marginBottom: 4 },
  customInput: { borderWidth: 1, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10, fontSize: 14, textAlign: 'center' },
  boardInfo: { fontSize: 12, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  rankCell: { width: 44, fontSize: 15, fontWeight: 'bold' },
  playerCell: { flex: 1, fontSize: 14 },
  timeCell: { width: 56, fontSize: 14, textAlign: 'right' },
  dateCell: { width: 80, fontSize: 12, textAlign: 'right', marginLeft: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retryBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  myPosition: { marginTop: 16, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
})
