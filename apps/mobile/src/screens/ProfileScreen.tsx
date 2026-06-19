import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { useNavigation } from '@react-navigation/native'
import type { RootStackParamList } from '../navigation/types'
import type { Profile } from '@minesweeper/types'

interface Stats {
  games_played: number
  wins: number
  losses: number
  win_rate: number
  best_time: number
}

interface Achievement {
  id: string
  key: string
  unlocked_at: string | null
}

export function ProfileScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const { user, signOut } = useAuth()
  const navigation = useNavigation<any>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      const [profRes, statsRes, achRes] = await Promise.all([
        api.profiles.me(),
        api.stats.me(),
        api.achievements.me(),
      ])
      setProfile(profRes.profile)
      setStats(statsRes as Stats)
      setAchievements(achRes as Achievement[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading profile')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t.profile.title}</Text>
        <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>Sign in to view your profile</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Auth')}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Sign In</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} testID="loading-indicator" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.danger }}>{error}</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary, marginTop: 12 }]} onPress={fetchData}>
          <Text style={{ color: '#fff' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const allAchievements = achievements.map(a => {
    const key = a.key as keyof typeof t.achievements
    const def = t.achievements[key]
    return { ...a, name: def?.name ?? a.key, description: def?.description ?? '' }
  })

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t.profile.title}</Text>

      {profile && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.username, { color: colors.text }]}>{profile.username}</Text>
          <Text style={{ color: colors.textSecondary }}>XP: {profile.xp}</Text>
          <Text style={{ color: colors.textSecondary }}>{t.profile.level} {profile.level}</Text>
        </View>
      )}

      {stats && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.profile.stats}</Text>
          <View style={styles.statRow}>
            <Text style={{ color: colors.textSecondary }}>{t.profile.gamesPlayed}</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{stats.games_played}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={{ color: colors.textSecondary }}>{t.profile.won}</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{stats.wins}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={{ color: colors.textSecondary }}>{t.profile.lost}</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{stats.losses}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={{ color: colors.textSecondary }}>{t.profile.winRate}</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{Math.round(stats.win_rate * 100)}%</Text>
          </View>
          {stats.best_time > 0 && (
            <View style={styles.statRow}>
              <Text style={{ color: colors.textSecondary }}>{t.profile.bestTime}</Text>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{stats.best_time}s</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.profile.achievements}</Text>
        {allAchievements.map(a => (
          <View key={a.id} style={[styles.achievement, { opacity: a.unlocked_at ? 1 : 0.4 }]}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{a.name}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{a.description}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.btn, { backgroundColor: colors.danger, marginTop: 16 }]} onPress={signOut}>
        <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>{t.auth.signOut}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  username: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  achievement: { paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
  btn: { padding: 12, borderRadius: 8 },
})
