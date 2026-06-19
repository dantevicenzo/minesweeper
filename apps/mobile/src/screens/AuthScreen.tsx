import { useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { useAuth } from '../contexts/AuthContext'
import { useNavigation } from '@react-navigation/native'

export function AuthScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple } = useAuth()
  const navigation = useNavigation()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async () => {
    setError(null)
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const fn = isSignUp ? signUpWithEmail : signInWithEmail
      const { error: authError } = await fn(email, password)
      if (authError) throw authError
      navigation.goBack()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }, [email, password, isSignUp, signInWithEmail, signUpWithEmail, navigation])

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>{isSignUp ? t.auth.signUp : t.auth.signIn}</Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="email-input"
      />

      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="password-input"
      />

      {error && <Text style={{ color: colors.danger, marginBottom: 8 }}>{error}</Text>}

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={handleSubmit}
        disabled={loading}
        testID="submit-btn"
      >
        {loading ? (
          <ActivityIndicator color="#fff" testID="loading-indicator" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>
            {isSignUp ? t.auth.signUp : t.auth.signIn}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { setIsSignUp(s => !s); setError(null) }} style={{ marginTop: 12 }}>
        <Text style={{ color: colors.primary, textAlign: 'center' }}>
          {isSignUp ? t.auth.hasAccount : t.auth.noAccount}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={{ color: colors.textSecondary, marginHorizontal: 12 }}>OR</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <TouchableOpacity
        style={[styles.oauthBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => signInWithGoogle().catch(e => setError(e.message))}
      >
        <Text style={{ color: colors.text }}>{t.auth.google}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.oauthBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => {}}
      >
        <Text style={{ color: colors.text }}>{t.auth.github}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.oauthBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: 0.5 }]}
        disabled
      >
        <Text style={{ color: colors.textSecondary }}>{t.auth.apple}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{t.auth.appleSoon}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  btn: { padding: 14, borderRadius: 8, marginTop: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1 },
  oauthBtn: { padding: 14, borderRadius: 8, borderWidth: 1, marginBottom: 8, alignItems: 'center' },
})
