import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { api } from '../lib/api'

const DIFFICULTIES = ['easy', 'medium', 'hard', 'custom'] as const
const PERIODS = ['all', 'today', 'week', 'month'] as const

interface LeaderboardEntry {
  id: string
  player_id: string
  player_name: string
  time: number
  created_at: string
  difficulty: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LeaderboardScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const [difficulty, setDifficulty] = useState('easy')
  const [period, setPeriod] = useState('all')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchEntries = useCallback(async (pageNum: number, append: boolean) => {
    try {
      setError(null)
      if (!append) setLoading(true)
      const res = await api.leaderboard.list(difficulty, pageNum, 20, period)
      const data = (res.data ?? []) as LeaderboardEntry[]
      if (append) {
        setEntries(prev => [...prev, ...data])
      } else {
        setEntries(data)
      }
      setHasMore(data.length === 20)
      setPage(pageNum)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }, [difficulty, period])

  useEffect(() => {
    setEntries([])
    setPage(1)
    setHasMore(true)
    fetchEntries(1, false)
  }, [difficulty, period, fetchEntries])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchEntries(1, false)
  }, [fetchEntries])

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true)
      fetchEntries(page + 1, true)
    }
  }, [loadingMore, hasMore, loading, page, fetchEntries])

  const renderItem = useCallback(({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = index + 1
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
    return (
      <View key={item.id} style={[styles.entry, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.rank, { color: colors.text }]}>
          {medal ?? `#${rank}`}
        </Text>
        <Text style={[styles.player, { color: colors.text }]}>{item.player_name}</Text>
        <Text style={[styles.time, { color: colors.text }]}>{formatTime(item.time)}</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    )
  }, [colors])

  const keyExtractor = useCallback((item: LeaderboardEntry) => item.id, [])

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t.leaderboard.title}</Text>

      <View style={styles.filterRow}>
        {DIFFICULTIES.map(d => (
          <TouchableOpacity
            key={d}
            style={[
              styles.filterBtn,
              { backgroundColor: difficulty === d ? colors.primary : colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={{ color: difficulty === d ? '#fff' : colors.text, fontSize: 13 }}>
              {t.game.difficulty[d as keyof typeof t.game.difficulty]}
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
              { backgroundColor: period === p ? colors.primary : colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setPeriod(p)}
          >
            <Text style={{ color: period === p ? '#fff' : colors.text, fontSize: 13 }}>
              {p === 'all' ? t.leaderboard.allTime : p === 'today' ? t.leaderboard.today : p === 'week' ? t.leaderboard.week : t.leaderboard.month}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} testID="loading-indicator" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.danger }}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => fetchEntries(1, false)}>
            <Text style={{ color: '#fff' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : entries.length === 0 ? (
        <Text style={[styles.centered, { color: colors.textSecondary }]}>{t.leaderboard.noEntries}</Text>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} /> : null}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  filterRow: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  entry: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  rank: { width: 40, fontSize: 16, fontWeight: 'bold' },
  player: { flex: 1, fontSize: 14 },
  time: { width: 60, fontSize: 14, textAlign: 'right' },
  date: { width: 80, fontSize: 12, textAlign: 'right', marginLeft: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retryBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
})
