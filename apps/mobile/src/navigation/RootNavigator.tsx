import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTheme } from '../contexts/ThemeContext'
import { GameScreen } from '../screens/GameScreen'
import { LeaderboardScreen } from '../screens/LeaderboardScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { AuthScreen } from '../screens/AuthScreen'
import { SetupUsernameScreen } from '../screens/SetupUsernameScreen'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  const { colors } = useTheme()

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: colors.primary,
          background: colors.bg,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.danger,
        },
        fonts: { regular: { fontFamily: 'System', fontWeight: '400' }, medium: { fontFamily: 'System', fontWeight: '500' }, bold: { fontFamily: 'System', fontWeight: '700' }, heavy: { fontFamily: 'System', fontWeight: '900' } },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ headerShown: true, headerTitle: 'Leaderboard', headerTintColor: colors.text, headerStyle: { backgroundColor: colors.surface } }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, headerTitle: 'Profile', headerTintColor: colors.text, headerStyle: { backgroundColor: colors.surface } }} />
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: true, headerTitle: 'Auth' }} />
        <Stack.Screen name="SetupUsername" component={SetupUsernameScreen} options={{ headerShown: true, headerTitle: 'Setup' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
