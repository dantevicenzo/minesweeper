import { useState, useCallback, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { useNavigation } from '@react-navigation/native'
import { api } from '../lib/api'

export function SetupUsernameScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const navigation = useNavigation()
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [message, setMessage] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkUsername = useCallback((value: string) => {
    setUsername(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (value.length < 3) {
      setAvailable(null)
      setMessage('')
      return
    }
    setChecking(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.profiles.usernameAvailable(value)
        setAvailable(res.available)
        setMessage(res.available ? t.setupUsername.available : t.setupUsername.taken)
      } catch {
        setAvailable(null)
        setMessage('Error checking availability')
      } finally {
        setChecking(false)
      }
    }, 500)
  }, [t.setupUsername.available, t.setupUsername.taken])

  const handleSubmit = useCallback(async () => {
    try {
      await api.profiles.updateMe({ username, full_name: fullName || undefined })
      navigation.goBack()
    } catch {
      setMessage('Failed to save profile')
    }
  }, [username, fullName, navigation])

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t.setupUsername.title}</Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder={t.setupUsername.username}
        placeholderTextColor={colors.textSecondary}
        value={username}
        onChangeText={checkUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {checking && <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 8 }} />}
      {message && !checking && (
        <Text style={{ color: available ? colors.success : colors.danger, marginBottom: 8 }}>{message}</Text>
      )}

      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder={t.setupUsername.fullName}
        placeholderTextColor={colors.textSecondary}
        value={fullName}
        onChangeText={setFullName}
      />

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.primary, opacity: available ? 1 : 0.5 }]}
        onPress={handleSubmit}
        disabled={!available}
      >
        <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>{t.setupUsername.submit}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  btn: { padding: 14, borderRadius: 8, marginTop: 8 },
})
