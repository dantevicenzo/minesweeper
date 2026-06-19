import React from 'react'
import { View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useTheme } from '../contexts/ThemeContext'
import { SmileyIcon } from '../components/icons/SmileyIcon'
import { TrophyIcon } from '../components/icons/TrophyIcon'
import { ProfileIcon } from '../components/icons/ProfileIcon'
import type { RootStackParamList, MainTabParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

const PlaceholderScreen = ({ route }: any) => {
  const { colors } = useTheme()
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.text }}>{route.name}</Text>
    </View>
  )
}

const tabIcons: Record<keyof MainTabParamList, (props: { color: string; size: number }) => React.ReactElement> = {
  Game: ({ color, size }) => <SmileyIcon width={size} height={size} color={color} />,
  Leaderboard: ({ color, size }) => <TrophyIcon width={size} height={size} color={color} />,
  Profile: ({ color, size }) => <ProfileIcon width={size} height={size} color={color} />,
}

function MainTabs() {
  const { colors } = useTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => tabIcons[route.name]({ color, size }),
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
      })}
    >
      <Tab.Screen name="Game" component={PlaceholderScreen} />
      <Tab.Screen name="Leaderboard" component={PlaceholderScreen} />
      <Tab.Screen name="Profile" component={PlaceholderScreen} />
    </Tab.Navigator>
  )
}

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
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Auth"
          component={PlaceholderScreen}
          options={{ headerShown: true, headerTitle: 'Auth', headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
