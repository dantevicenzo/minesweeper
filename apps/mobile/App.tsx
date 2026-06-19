import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider } from './src/contexts/ThemeContext'
import { I18nProvider } from './src/contexts/I18nContext'
import { AuthProvider } from './src/contexts/AuthContext'
import { RootNavigator } from './src/navigation/RootNavigator'

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
