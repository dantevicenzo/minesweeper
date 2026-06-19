# Mobile React Native (Fase 6) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native mobile app with full feature parity to the existing web app (game, auth, leaderboard, profile, offline-first).

**Architecture:** New `apps/mobile` React Native CLI project sharing `@minesweeper/engine`, `@minesweeper/hooks`, `@minesweeper/types`, and `@minesweeper/utils` from the monorepo. Navigation via React Navigation (bottom tabs + native stack). AsyncStorage for persistence. Theme/I18n contexts adapted for RN.

**Tech Stack:** React Native 0.79, React 19, React Navigation 7, Supabase JS v2, AsyncStorage, react-native-svg, @react-native-community/netinfo, @react-native-google-signin/google-signin

## Global Constraints

- Must work on both iOS and Android simultaneously
- All existing web tests must continue to pass
- Engine/shared packages must not be modified for mobile
- No external UI library (custom components, same as web philosophy)
- Follow existing monorepo patterns (pnpm workspace, shared tsconfig)
- Icon SVGs converted from web's inline SVGs to react-native-svg components

---

## File Structure

```
apps/mobile/
  App.tsx                         ← Entry: NavigationContainer + providers
  app.json
  metro.config.js                 ← Additional watchFolders for monorepo
  babel.config.js
  tsconfig.json                   ← Extends root tsconfig
  react-native.config.js
  package.json
  src/
    navigation/
      RootNavigator.tsx           ← BottomTab (Game, Leaderboard, Profile) + stacks
    screens/
      GameScreen.tsx              ← GameBoard wrapper
      LeaderboardScreen.tsx       ← Paginated leaderboard list
      ProfileScreen.tsx           ← Profile stats + achievements
      AuthScreen.tsx              ← Login/signup OAuth screen
      SetupUsernameScreen.tsx     ← Post-auth username setup
    components/
      GameBoard.tsx               ← Game board (grid, header, timer)
      CellView.tsx                ← Individual cell (Pressable + SVG)
      GameHeader.tsx              ← Mine counter, timer, smiley, buttons
      MineCounter.tsx             ← LED-style 3-digit counter
      ResultModal.tsx             ← Endgame result dialog
      SimpleBottomSheet.tsx       ← Bottom sheet with backdrop
      GameMenu.tsx                ← Game settings menu content
      OAuthButton.tsx             ← Google/GitHub/Apple auth buttons
      StatRow.tsx                 ← Label-value row
      AchievementCard.tsx         ← Achievement display
      icons/
        index.ts                  ← Re-export all icons
        FlagIcon.tsx
        MineIcon.tsx
        NumberIcon.tsx            ← Numbers 1-8 as SVG
        SmileyIcon.tsx
        GlassesIcon.tsx
        WorriedIcon.tsx
        XeyesIcon.tsx
        TrophyIcon.tsx
        GearIcon.tsx
        ProfileIcon.tsx
        TimerDigit.tsx            ← 7-segment digit SVG
    contexts/
      ThemeContext.tsx             ← Light/dark theme (Appearance API + AsyncStorage)
      I18nContext.tsx             ← i18n (AsyncStorage for persistence)
      AuthContext.tsx             ← Supabase auth state
    lib/
      supabase.ts                 ← Supabase client (AsyncStorage adapter)
      api.ts                      ← API client (fetch + NetInfo for offline)
      storage.ts                  ← AsyncStorage wrapper (game save/restore)
      sync.ts                     ← Offline sync queue (AsyncStorage)
    messages/
      en.json                     ← Copy from web
      pt-BR.json                  ← Copy from web
    __tests__/
      setup.ts                    ← Jest setup file
```

---

### Task 1: Project Setup + Monorepo Integration

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/metro.config.js`
- Create: `apps/mobile/babel.config.js`
- Create: `apps/mobile/react-native.config.js`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/index.js`
- Create: `apps/mobile/src/__tests__/setup.ts`
- Modify: `pnpm-workspace.yaml` (add `apps/mobile`)
- Modify: `vitest.workspace.ts` (add mobile test project)

**Interfaces:**
- Produces: A working React Native project that can resolve `@minesweeper/*` packages via pnpm workspace

- [ ] **Step 1: Create `apps/mobile/package.json`**

```json
{
  "name": "@minesweeper/mobile",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-native": "^0.79.0",
    "@minesweeper/engine": "workspace:*",
    "@minesweeper/hooks": "workspace:*",
    "@minesweeper/types": "workspace:*",
    "@minesweeper/utils": "workspace:*",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "react-native-screens": "^4.0.0",
    "react-native-safe-area-context": "^5.0.0",
    "react-native-svg": "^15.0.0",
    "@react-native-async-storage/async-storage": "^2.0.0",
    "@react-native-community/netinfo": "^11.0.0",
    "@supabase/supabase-js": "^2.49.0",
    "@react-native-google-signin/google-signin": "^13.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@testing-library/react-native": "^12.0.0",
    "react-native-svg-transformer": "^1.0.0",
    "metro-react-native-babel-preset": "^0.77.0"
  }
}
```

- [ ] **Step 2: Create `apps/mobile/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-native",
    "module": "esnext",
    "moduleResolution": "bundler",
    "target": "esnext",
    "lib": ["es2022"],
    "allowJs": true,
    "paths": {
      "@minesweeper/engine": ["../../packages/engine/src"],
      "@minesweeper/hooks": ["../../packages/hooks/src"],
      "@minesweeper/types": ["../../packages/types/src"],
      "@minesweeper/utils": ["../../packages/utils/src"]
    }
  },
  "include": ["src/**/*", "App.tsx", "index.js"]
}
```

- [ ] **Step 3: Create `apps/mobile/metro.config.js`**

```js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const path = require('path')

const defaultConfig = getDefaultConfig(__dirname)

const config = {
  watchFolders: [
    path.resolve(__dirname, '../../packages'),
  ],
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },
}

module.exports = mergeConfig(defaultConfig, config)
```

- [ ] **Step 4: Create `apps/mobile/babel.config.js`**

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
}
```

- [ ] **Step 5: Create `apps/mobile/react-native.config.js`**

```js
module.exports = {
  project: {
    ios: {},
    android: {},
  },
}
```

- [ ] **Step 6: Create `apps/mobile/app.json`**

```json
{
  "name": "Minesweeper",
  "displayName": "Minesweeper"
}
```

- [ ] **Step 7: Create `apps/mobile/index.js`**

```js
import { AppRegistry } from 'react-native'
import App from './App'
import { name as appName } from './app.json'

AppRegistry.registerComponent(appName, () => App)
```

- [ ] **Step 8: Create `apps/mobile/src/__tests__/setup.ts`**

```ts
// Jest setup for React Native tests
// Mock native modules that would require device
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)
```

- [ ] **Step 9: Update `pnpm-workspace.yaml`**

Add `apps/mobile` to the workspace packages list:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'docs/**'
```

- [ ] **Step 10: Update `vitest.workspace.ts`**

Add mobile project config. The mobile uses Jest (not Vitest) for RN compatibility, so just ensure it's excluded from the vitest workspace.

- [ ] **Step 11: Install dependencies**

```bash
cd apps/mobile && pnpm install
```

- [ ] **Step 12: Verify TypeScript compiles**

```bash
cd apps/mobile && npx tsc --noEmit
```
Expected: No errors (or only expected RN type errors)

- [ ] **Step 13: Commit**

```bash
git add apps/mobile/ pnpm-workspace.yaml
git commit -m "feat: scaffold React Native mobile app in monorepo"
```

---

### Task 2: Port Shared Lib (supabase, storage, api, sync)

**Files:**
- Create: `apps/mobile/src/lib/supabase.ts`
- Create: `apps/mobile/src/lib/storage.ts`
- Create: `apps/mobile/src/lib/api.ts`
- Create: `apps/mobile/src/lib/sync.ts`
- Create: `apps/mobile/src/lib/__tests__/storage.test.ts`

**Interfaces:**
- Consumes: `@react-native-async-storage/async-storage`, `@react-native-community/netinfo`, `@supabase/supabase-js`
- Produces: `supabase`, `api`, `storage`, `sync` modules matching web interfaces

- [ ] **Step 1: Create `apps/mobile/src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl) throw new Error('EXPO_PUBLIC_SUPABASE_URL is required')
if (!supabaseAnonKey) throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: false,
    persistSession: true,
    storage: AsyncStorage,
  },
})
```

Note: `detectSessionInUrl: false` because RN doesn't handle URL-based session detection the same as web. OAuth will use `supabase.auth.signInWithOAuth` which opens browser and returns via deep link.

- [ ] **Step 2: Create `apps/mobile/src/lib/storage.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'

const SAVED_GAME_KEY = 'minesweeper_saved_game'

interface SavedGame {
  width: number
  height: number
  mineCount: number
  difficulty: string
  state: unknown
  updatedAt: number
}

export async function saveGameLocally(data: SavedGame): Promise<void> {
  await AsyncStorage.setItem(SAVED_GAME_KEY, JSON.stringify(data))
}

export async function loadSavedGame(): Promise<SavedGame | null> {
  const raw = await AsyncStorage.getItem(SAVED_GAME_KEY)
  return raw ? JSON.parse(raw) : null
}

export async function clearSavedGame(): Promise<void> {
  await AsyncStorage.removeItem(SAVED_GAME_KEY)
}

export async function hasSavedGame(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(SAVED_GAME_KEY)
  return raw !== null
}
```

- [ ] **Step 3: Write storage tests**

Create `apps/mobile/src/lib/__tests__/storage.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { saveGameLocally, loadSavedGame, clearSavedGame, hasSavedGame } from '../storage'

describe('storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  it('saves and loads a game', async () => {
    const game = { width: 9, height: 9, mineCount: 10, difficulty: 'easy', state: { board: [] }, updatedAt: Date.now() }
    await saveGameLocally(game)
    const loaded = await loadSavedGame()
    expect(loaded?.width).toBe(9)
    expect(loaded?.difficulty).toBe('easy')
  })

  it('returns null when no saved game exists', async () => {
    const loaded = await loadSavedGame()
    expect(loaded).toBeNull()
  })

  it('clears saved game', async () => {
    await saveGameLocally({ width: 9, height: 9, mineCount: 10, difficulty: 'easy', state: {}, updatedAt: 1 })
    await clearSavedGame()
    expect(await hasSavedGame()).toBe(false)
  })

  it('detects existing saved game', async () => {
    expect(await hasSavedGame()).toBe(false)
    await saveGameLocally({ width: 9, height: 9, mineCount: 10, difficulty: 'easy', state: {}, updatedAt: 1 })
    expect(await hasSavedGame()).toBe(true)
  })
})
```

- [ ] **Step 4: Run storage tests**

```bash
cd apps/mobile && npx jest src/lib/__tests__/storage.test.ts
```
Expected: PASS

- [ ] **Step 5: Create `apps/mobile/src/lib/api.ts`**

Same logic as web's api.ts but using NetInfo instead of `navigator.onLine`:

```ts
import NetInfo from '@react-native-community/netinfo'
import { supabase } from './supabase'
import { enqueue } from './sync'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const netState = await NetInfo.fetch()
  if (!netState.isConnected) {
    enqueue({ method: options.method ?? 'GET', path, body: options.body ? JSON.parse(options.body as string) : undefined })
    throw new Error('offline')
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}
```

Then export the same `api` object structure as the web.

- [ ] **Step 6: Create `apps/mobile/src/lib/sync.ts`**

Same logic as web's sync.ts but using AsyncStorage:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'

const QUEUE_KEY = 'minesweeper_sync_queue'

interface SyncOperation {
  id: string
  method: string
  path: string
  body?: unknown
  createdAt: number
}

export async function enqueue(op: Omit<SyncOperation, 'id' | 'createdAt'>): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  const queue: SyncOperation[] = raw ? JSON.parse(raw) : []
  queue.push({ ...op, id: `${Date.now()}_${Math.random()}`, createdAt: Date.now() })
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY)
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch()
  return state.isConnected ?? false
}

export async function processQueue(): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  if (!raw) return
  const queue: SyncOperation[] = JSON.parse(raw)
  const remaining: SyncOperation[] = []
  for (const op of queue) {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}${op.path}`, {
        method: op.method,
        headers: { 'Content-Type': 'application/json' },
        body: op.body ? JSON.stringify(op.body) : undefined,
      })
    } catch {
      remaining.push(op)
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/lib/
git commit -m "feat(mobile): port supabase, storage, api, and sync modules"
```

---

### Task 3: Theme + I18n Contexts + Messages

**Files:**
- Create: `apps/mobile/src/contexts/ThemeContext.tsx`
- Create: `apps/mobile/src/contexts/I18nContext.tsx`
- Create: `apps/mobile/src/messages/en.json` (copy from web)
- Create: `apps/mobile/src/messages/pt-BR.json` (copy from web)
- Create: `apps/mobile/src/contexts/__tests__/ThemeContext.test.tsx`

**Interfaces:**
- Produces: `ThemeContextValue { theme, colors, toggleTheme }`, `I18nContextValue { locale, t, setLocale }`

- [ ] **Step 1: Copy messages from web**

```bash
cp apps/web/src/messages/en.json apps/mobile/src/messages/en.json
cp apps/web/src/messages/pt-BR.json apps/mobile/src/messages/pt-BR.json
```

- [ ] **Step 2: Create `apps/mobile/src/contexts/ThemeContext.tsx`**

```tsx
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Appearance, useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const THEME_KEY = 'theme'

interface ThemeColors {
  bg: string
  bgSecondary: string
  surface: string
  border: string
  text: string
  textSecondary: string
  primary: string
  primaryHover: string
  danger: string
  success: string
  warning: string
  cellBg: string
  cellBgHover: string
  cellRevealed: string
  cellBorderLight: string
  cellBorderDark: string
  cellMineExploded: string
  flag: string
  mine: string
  counterBg: string
  counterText: string
  number: Record<number, string>
}

const lightColors: ThemeColors = {
  bg: '#f0f0f0', bgSecondary: '#e0e0e0', surface: '#ffffff', border: '#d4d4d4',
  text: '#1a1a1a', textSecondary: '#666666', primary: '#2563eb', primaryHover: '#1d4ed8',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
  cellBg: '#bdbdbd', cellBgHover: '#c8c8c8', cellRevealed: '#cecece',
  cellBorderLight: '#ffffff', cellBorderDark: '#7b7b7b', cellMineExploded: '#e74c3c',
  flag: '#dc2626', mine: '#1a1a1a', counterBg: '#1a0000', counterText: '#ff0000',
  number: { 1: '#0000ff', 2: '#008000', 3: '#ff0000', 4: '#000080', 5: '#800000', 6: '#008080', 7: '#000000', 8: '#808080' },
}

const darkColors: ThemeColors = {
  bg: '#1a1a1a', bgSecondary: '#2a2a2a', surface: '#333333', border: '#555555',
  text: '#f0f0f0', textSecondary: '#a0a0a0', primary: '#3b82f6', primaryHover: '#60a5fa',
  danger: '#ef4444', success: '#22c55e', warning: '#f59e0b',
  cellBg: '#3a3a3a', cellBgHover: '#454545', cellRevealed: '#2a2a2a',
  cellBorderLight: '#5a5a5a', cellBorderDark: '#1a1a1a', cellMineExploded: '#992222',
  flag: '#ef4444', mine: '#cccccc', counterBg: '#330000', counterText: '#ff4444',
  number: { 1: '#6ba3ff', 2: '#4cce4c', 3: '#ff6666', 4: '#7a8cff', 5: '#ff8c66', 6: '#5ccccc', 7: '#cccccc', 8: '#999999' },
}

interface ThemeContextValue {
  theme: 'light' | 'dark'
  colors: ThemeColors
  toggleTheme: () => void
  setTheme: (t: 'light' | 'dark') => void
}

const ThemeContext = createContext<ThemeContextValue>(null!)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(saved => {
      if (saved === 'light' || saved === 'dark') setThemeState(saved)
      else setThemeState(systemScheme === 'dark' ? 'dark' : 'light')
    })
  }, [systemScheme])

  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t)
    AsyncStorage.setItem(THEME_KEY, t)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  const colors = theme === 'light' ? lightColors : darkColors

  return <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
```

- [ ] **Step 3: Create `apps/mobile/src/contexts/I18nContext.tsx`**

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import en from '../messages/en.json'
import ptBR from '../messages/pt-BR.json'

type Locale = 'en' | 'pt-BR'
type Messages = typeof en

const messages: Record<Locale, Messages> = { en, 'pt-BR': ptBR }

function getDeviceLocale(): Locale {
  // Simplified: RN doesn't have navigator.language
  // Use expo-localization or a simple fallback
  return 'en'
}

interface I18nContextValue {
  locale: Locale
  t: Messages
  setLocale: (l: Locale) => void
}

const I18nContext = createContext<I18nContextValue>(null!)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    AsyncStorage.getItem('locale').then(saved => {
      if (saved === 'en' || saved === 'pt-BR') setLocaleState(saved)
      else setLocaleState(getDeviceLocale())
    })
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    AsyncStorage.setItem('locale', l)
  }

  const t = messages[locale]

  return <I18nContext.Provider value={{ locale, t, setLocale }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
```

- [ ] **Step 4: Create ThemeContext test**

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { ThemeProvider, useTheme } from '../ThemeContext'
import { Text, Button } from 'react-native'

function TestComponent() {
  const { theme, toggleTheme, colors } = useTheme()
  return (
    <>
      <Text testID="theme">{theme}</Text>
      <Text testID="bg">{colors.bg}</Text>
      <Button title="Toggle" onPress={toggleTheme} />
    </>
  )
}

describe('ThemeContext', () => {
  it('provides light theme by default', () => {
    render(<ThemeProvider><TestComponent /></ThemeProvider>)
    expect(screen.getByTestId('theme').children[0]).toBe('light')
  })
})
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/contexts/ apps/mobile/src/messages/
git commit -m "feat(mobile): add Theme, I18n contexts and message files"
```

---

### Task 4: Port SVG Icons to react-native-svg

**Files:**
- Create: `apps/mobile/src/components/icons/index.ts`
- Create: `apps/mobile/src/components/icons/FlagIcon.tsx`
- Create: `apps/mobile/src/components/icons/MineIcon.tsx`
- Create: `apps/mobile/src/components/icons/NumberIcon.tsx`
- Create: `apps/mobile/src/components/icons/SmileyIcon.tsx`
- Create: `apps/mobile/src/components/icons/GlassesIcon.tsx`
- Create: `apps/mobile/src/components/icons/WorriedIcon.tsx`
- Create: `apps/mobile/src/components/icons/XeyesIcon.tsx`
- Create: `apps/mobile/src/components/icons/TrophyIcon.tsx`
- Create: `apps/mobile/src/components/icons/GearIcon.tsx`
- Create: `apps/mobile/src/components/icons/ProfileIcon.tsx`
- Create: `apps/mobile/src/components/icons/TimerDigit.tsx`
- Test: `apps/mobile/src/components/icons/__tests__/FlagIcon.test.tsx`

- [ ] **Step 1: Create icon components**

Each icon is a react-native-svg Svg component wrapping the SVG path from the web.

Example `FlagIcon.tsx`:
```tsx
import Svg, { Path } from 'react-native-svg'

interface IconProps {
  width?: number
  height?: number
  color?: string
}

export function FlagIcon({ width = 18, height = 18, color = '#dc2626' }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 18 18">
      <Path d="M4 2v14M4 2l10 4-10 4" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
```

Each icon follows this pattern with the SVG paths from the web's inline SVGs.

- [ ] **Step 2: Create `icons/index.ts`**

```ts
export { FlagIcon } from './FlagIcon'
export { MineIcon } from './MineIcon'
export { NumberIcon } from './NumberIcon'
export { SmileyIcon } from './SmileyIcon'
export { GlassesIcon } from './GlassesIcon'
export { WorriedIcon } from './WorriedIcon'
export { XeyesIcon } from './XeyesIcon'
export { TrophyIcon } from './TrophyIcon'
export { GearIcon } from './GearIcon'
export { ProfileIcon } from './ProfileIcon'
export { TimerDigit } from './TimerDigit'
```

- [ ] **Step 3: Write a basic icon test**

```tsx
import { render } from '@testing-library/react-native'
import { FlagIcon } from '../FlagIcon'

describe('FlagIcon', () => {
  it('renders with default size', () => {
    const { getByTestId } = render(<FlagIcon testID="flag" />)
    // SVG renders; just verify it mounts without error
    expect(getByTestId('flag')).toBeTruthy()
  })
})
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/icons/
git commit -m "feat(mobile): add SVG icon components for game UI"
```

---

### Task 5: CellView Component

**Files:**
- Create: `apps/mobile/src/components/CellView.tsx`
- Create: `apps/mobile/src/components/__tests__/CellView.test.tsx`

**Interfaces:**
- Consumes: `Cell` type from engine, icon components
- Produces: `<CellView>` with touch handling (tap = reveal, long-press = flag)

- [ ] **Step 1: Write failing tests**

```tsx
import { render, fireEvent } from '@testing-library/react-native'
import { CellView } from '../CellView'
import type { Cell } from '@minesweeper/engine'

function hiddenCell(): Cell {
  return { hasMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0, isExploded: false }
}

describe('CellView', () => {
  it('renders hidden cell', () => {
    const { getByRole } = render(<CellView cell={hiddenCell()} onPress={() => {}} onLongPress={() => {}} />)
    expect(getByRole('button')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByRole } = render(<CellView cell={hiddenCell()} onPress={onPress} onLongPress={() => {}} />)
    fireEvent.press(getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('calls onLongPress when long-pressed', () => {
    const onLongPress = jest.fn()
    const { getByRole } = render(<CellView cell={hiddenCell()} onPress={() => {}} onLongPress={onLongPress} />)
    fireEvent(getByRole('button'), 'onLongPress')
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it('shows flag icon when flagged', () => {
    const flagged: Cell = { ...hiddenCell(), isFlagged: true }
    const { getByTestId } = render(<CellView cell={flagged} onPress={() => {}} onLongPress={() => {}} />)
    expect(getByTestId('FlagIcon')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/mobile && npx jest src/components/__tests__/CellView.test.tsx
```
Expected: FAIL — component not found

- [ ] **Step 3: Create `CellView.tsx`**

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { FlagIcon } from './icons/FlagIcon'
import { MineIcon } from './icons/MineIcon'
import { NumberIcon } from './icons/NumberIcon'
import { useTheme } from '../contexts/ThemeContext'
import type { Cell } from '@minesweeper/engine'

interface CellViewProps {
  cell: Cell
  gameStatus: string
  flagMode?: boolean
  onPress: () => void
  onLongPress: () => void
}

export function CellView({ cell, gameStatus, flagMode, onPress, onLongPress }: CellViewProps) {
  const { colors } = useTheme()

  const handlePress = () => {
    if (cell.isRevealed && cell.adjacentMines > 0) {
      // chord — handled by parent via onLongPress
      onLongPress()
    } else if (flagMode && !cell.isRevealed) {
      onLongPress()
    } else {
      onPress()
    }
  }

  const cellStyle = [
    styles.cell,
    cell.isRevealed
      ? { backgroundColor: colors.cellRevealed, borderWidth: 1, borderColor: colors.cellBorderDark }
      : {
          backgroundColor: colors.cellBg,
          borderTopWidth: 3, borderLeftWidth: 3,
          borderBottomWidth: 3, borderRightWidth: 3,
          borderTopColor: colors.cellBorderLight,
          borderLeftColor: colors.cellBorderLight,
          borderBottomColor: colors.cellBorderDark,
          borderRightColor: colors.cellBorderDark,
        },
    cell.isExploded && { backgroundColor: colors.cellMineExploded },
  ]

  return (
    <Pressable
      style={cellStyle}
      onPress={handlePress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={cell.isRevealed ? `Cell ${cell.adjacentMines}` : cell.isFlagged ? 'Flagged' : 'Hidden'}
    >
      {cell.isRevealed && cell.hasMine && <MineIcon />}
      {cell.isRevealed && !cell.hasMine && cell.adjacentMines > 0 && (
        <NumberIcon number={cell.adjacentMines} color={colors.number[cell.adjacentMines] ?? colors.text} />
      )}
      {!cell.isRevealed && cell.isFlagged && <FlagIcon />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  cell: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/mobile && npx jest src/components/__tests__/CellView.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/CellView.tsx apps/mobile/src/components/__tests__/CellView.test.tsx
git commit -m "feat(mobile): add CellView component with touch handling"
```

---

### Task 6: AuthContext

**Files:**
- Create: `apps/mobile/src/contexts/AuthContext.tsx`
- Create: `apps/mobile/src/contexts/__tests__/AuthContext.test.tsx`

**Interfaces:**
- Produces: `AuthContextValue { user, loading, signUp, signIn, signInWithProvider, signOut }`

- [ ] **Step 1: Create `apps/mobile/src/contexts/AuthContext.tsx`**

Follows the same pattern as the web `AuthContext` but:
- No router redirect for `setup-username` (handled by navigation)
- `signInWithProvider` for Google uses `@react-native-google-signin/google-signin`
- Others use `supabase.auth.signInWithOAuth`

```tsx
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithProvider: (provider: 'google' | 'apple' | 'github') => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signInWithProvider = useCallback(async (provider: 'google' | 'apple' | 'github') => {
    if (provider === 'google') {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin')
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      })
      const { idToken } = await GoogleSignin.signIn()
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
      if (error) throw error
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: 'minesweeper://auth/callback' },
      })
      if (error) throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithProvider, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/contexts/AuthContext.tsx
git commit -m "feat(mobile): add AuthContext with supabase and Google Sign-In"
```

---

### Task 7: Navigation (Bottom Tabs + Stacks)

**Files:**
- Create: `apps/mobile/src/navigation/RootNavigator.tsx`
- Create: `apps/mobile/src/navigation/types.ts`

**Interfaces:**
- Consumes: screens (to be created in later tasks)
- Produces: Navigation structure matching the design

- [ ] **Step 1: Create `apps/mobile/src/navigation/types.ts`**

```ts
export type RootTabParamList = {
  Game: undefined
  Leaderboard: undefined
  Profile: undefined
}

export type RootStackParamList = {
  Main: undefined
  Auth: undefined
  Settings: undefined
  SetupUsername: undefined
}
```

- [ ] **Step 2: Create `apps/mobile/src/navigation/RootNavigator.tsx`**

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { GameScreen } from '../screens/GameScreen'
import { LeaderboardScreen } from '../screens/LeaderboardScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { AuthScreen } from '../screens/AuthScreen'
import { useTheme } from '../contexts/ThemeContext'
import { TrophyIcon, ProfileIcon } from '../components/icons'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function MainTabs() {
  const { colors } = useTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="Game"
        component={GameScreen}
        options={{ tabBarLabel: 'Game', tabBarIcon: ({ color }) => <TrophyIcon color={color} /> }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarLabel: 'Leaderboard', tabBarIcon: ({ color }) => <TrophyIcon color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <ProfileIcon color={color} /> }}
      />
    </Tab.Navigator>
  )
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/navigation/
git commit -m "feat(mobile): add navigation with bottom tabs and stacks"
```

---

### Task 8: GameScreen + GameBoard

**Files:**
- Create: `apps/mobile/src/screens/GameScreen.tsx`
- Create: `apps/mobile/src/components/GameBoard.tsx`
- Create: `apps/mobile/src/components/GameHeader.tsx`
- Create: `apps/mobile/src/components/MineCounter.tsx`
- Create: `apps/mobile/src/components/SimpleBottomSheet.tsx`
- Create: `apps/mobile/src/components/GameMenu.tsx`
- Create: `apps/mobile/src/components/ResultModal.tsx`

**Interfaces:**
- Consumes: `useGame` from hooks, `useAuth`, `useI18n`, `useTheme`, icons, CellView, storage, api
- Produces: Complete game screen with board, timer, mine counter, flag mode, bottom sheet menu, result modal

- [ ] **Step 1: Create `MineCounter.tsx`**

```tsx
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

interface MineCounterProps {
  value: number
}

export function MineCounter({ value }: MineCounterProps) {
  const { colors } = useTheme()
  const display = Math.max(-99, Math.min(999, value))
  const str = display < 0 ? `-${Math.abs(display).toString().padStart(2, '0')}` : display.toString().padStart(3, '0')

  return (
    <View style={[styles.container, { backgroundColor: colors.counterBg }]}>
      <Text style={[styles.digit, { color: colors.counterText }]}>{str}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2 },
  digit: { fontFamily: 'Courier New', fontSize: 20, fontWeight: '700', letterSpacing: 2 },
})
```

- [ ] **Step 2: Create `SimpleBottomSheet.tsx`**

```tsx
import { useEffect, useRef, ReactNode } from 'react'
import { View, Text, Modal, Pressable, StyleSheet, Animated, Dimensions } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

interface SimpleBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function SimpleBottomSheet({ isOpen, onClose, title, children }: SimpleBottomSheetProps) {
  const { colors } = useTheme()
  const slideAnim = useRef(new Animated.Value(0)).current
  const { height } = Dimensions.get('window')

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [isOpen, slideAnim])

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  })

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.sheet, { backgroundColor: colors.surface, transform: [{ translateY }] }]}>
          <Pressable onPress={() => {}}>
            <View style={styles.handle} />
            {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '75%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
})
```

- [ ] **Step 3: Create `ResultModal.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { XeyesIcon, GlassesIcon } from './icons'

interface ResultModalProps {
  status: 'won' | 'lost'
  time: number
  difficulty: string
  mineCount: number
  flagCount: number
  clickCount: number
  width: number
  height: number
  xpEarned?: number
  onPlayAgain: () => void
}

export function ResultModal({ status, time, mineCount, flagCount, clickCount, width, height, xpEarned, onPlayAgain }: ResultModalProps) {
  const { colors } = useTheme()
  const { t } = useI18n()
  const btnRef = useRef<HTMLButtonElement>(null)

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onPlayAgain}>
      <View style={styles.backdrop}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.emoji}>{status === 'won' ? <GlassesIcon /> : <XeyesIcon />}</View>
          <Text style={[styles.title, { color: colors.text }]}>{status === 'won' ? t.game.win : t.game.lose}</Text>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.game.stats}</Text>
            <StatRow label={t.game.time} value={`${time}s`} />
            <StatRow label={t.game.board} value={`${width}\u00D7${height}`} />
            <StatRow label={t.game.mines} value={`${mineCount}/${flagCount}`} />
            <StatRow label={t.game.clicks} value={`${clickCount}`} />
          </View>

          {xpEarned != null && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.game.xpEarned}</Text>
              <Text style={[styles.xpValue, { color: colors.primary }]}>+{xpEarned}</Text>
            </View>
          )}

          <Pressable style={[styles.btn, { backgroundColor: colors.primary }]} onPress={onPlayAgain}>
            <Text style={styles.btnText}>{t.game.playAgain}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme()
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    borderRadius: 12, padding: 24, minWidth: 220, maxWidth: '90%',
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 32,
  },
  emoji: { marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  section: { marginBottom: 12, width: '100%' },
  sectionTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '600' },
  xpValue: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  btn: { marginTop: 16, width: '100%', padding: 10, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
```

- [ ] **Step 4: Create `GameHeader.tsx`**

```tsx
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
```

- [ ] **Step 5: Create `GameMenu.tsx`**

Same logic as `apps/web/src/components/GameMenu.tsx`. Contains: difficulty buttons (easy/medium/hard/custom), custom game inputs (width, height, mines), language selector (en/pt-BR), theme toggle (light/dark), sign out button (if logged in). Uses `useI18n`, `useTheme`, `useAuth` contexts. Interface:

```ts
interface GameMenuProps {
  onClose: () => void
  onStartGame: (difficulty: string, width?: number, height?: number, mineCount?: number) => void
  onNewGame: () => void
  currentDifficulty?: string
}
```

- [ ] **Step 6: Create `GameBoard.tsx`**

The core game board component. Uses `useGame` from `@minesweeper/hooks`, manages timer state, renders the grid of CellViews, handles touch interactions, and shows ResultModal on game end.

```tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native'
import { useGame } from '@minesweeper/hooks'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useTheme } from '../contexts/ThemeContext'
import { GameHeader } from './GameHeader'
import { CellView } from './CellView'
import { ResultModal } from './ResultModal'
import type { GameAction } from '@minesweeper/engine'

interface GameBoardProps {
  width: number
  height: number
  mineCount: number
  difficulty?: string
  onOpenMenu?: () => void
  onOpenLeaderboard?: () => void
  onOpenProfile?: () => void
}

export function GameBoard({ width, height, mineCount, difficulty = 'easy', onOpenMenu, onOpenLeaderboard, onOpenProfile }: GameBoardProps) {
  const { user } = useAuth()
  const { colors } = useTheme()
  const { game, dispatch, reset } = useGame(width, height, mineCount)
  const [time, setTime] = useState(0)
  const [face, setFace] = useState<'default' | 'worried' | 'won' | 'lost'>('default')
  const [showResult, setShowResult] = useState(false)
  const [flagMode, setFlagMode] = useState(false)
  const clickCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (game.status === 'playing' && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1)
      }, 1000)
    }
    if (game.status === 'won' || game.status === 'lost') {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      setShowResult(true)
      setFace(game.status === 'won' ? 'won' : 'lost')
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [game.status])

  const wrappedDispatch = useCallback((action: GameAction) => {
    clickCountRef.current += 1
    dispatch(action)
  }, [dispatch])

  const wrappedReset = useCallback(() => {
    clickCountRef.current = 0
    setTime(0)
    setShowResult(false)
    setFace('default')
    reset()
  }, [reset])

  const xpMap: Record<string, number> = { easy: 100, medium: 150, hard: 200 }
  const xpEarned = user && game.status === 'won' ? (xpMap[difficulty] ?? 100) : undefined

  const handleCellPress = (row: number, col: number) => {
    if (flagMode) {
      wrappedDispatch({ type: 'flag', row, col })
    } else {
      wrappedDispatch({ type: 'reveal', row, col })
    }
  }

  const handleCellLongPress = (row: number, col: number) => {
    const cell = game.board[row][col]
    if (cell.isRevealed && cell.adjacentMines > 0) {
      wrappedDispatch({ type: 'chord', row, col })
    } else {
      wrappedDispatch({ type: 'flag', row, col })
    }
  }

  const { width: screenWidth } = Dimensions.get('window')
  const cellSize = 28
  const boardWidth = width * cellSize
  const scale = Math.min(1, (screenWidth - 16) / boardWidth)

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg }]}>
      <GameHeader
        mineCount={mineCount} flagCount={game.flagCount} time={time}
        face={face} flagMode={flagMode}
        onFlagModeToggle={() => setFlagMode(f => !f)}
        onReset={wrappedReset}
        onOpenMenu={onOpenMenu ?? (() => {})} onOpenLeaderboard={onOpenLeaderboard ?? (() => {})}
        onOpenProfile={onOpenProfile ?? (() => {})}
      />
      <ScrollView horizontal style={styles.scrollContainer}>
        <View style={[styles.grid, { width: boardWidth * scale, height: height * cellSize * scale, transform: [{ scale }] }]}>
          {game.board.map((row, rowIdx) =>
            row.map((_, colIdx) => (
              <CellView
                key={`${rowIdx}-${colIdx}`}
                cell={game.board[rowIdx][colIdx]}
                gameStatus={game.status}
                flagMode={flagMode}
                onPress={() => handleCellPress(rowIdx, colIdx)}
                onLongPress={() => handleCellLongPress(rowIdx, colIdx)}
              />
            ))
          )}
        </View>
      </ScrollView>
      {showResult && (
        <ResultModal
          status={game.status as 'won' | 'lost'}
          time={time} difficulty={difficulty}
          mineCount={mineCount} flagCount={game.flagCount}
          clickCount={clickCountRef.current}
          width={width} height={height}
          xpEarned={xpEarned}
          onPlayAgain={wrappedReset}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scrollContainer: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
})
```

- [ ] **Step 7: Create `GameScreen.tsx`**

```tsx
import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { GameBoard } from '../components/GameBoard'
import { SimpleBottomSheet } from '../components/SimpleBottomSheet'
import { GameMenu } from '../components/GameMenu'
import { useTheme } from '../contexts/ThemeContext'

export function GameScreen() {
  const { colors } = useTheme()
  const [difficulty, setDifficulty] = useState('easy')
  const [width, setWidth] = useState(9)
  const [height, setHeight] = useState(9)
  const [mineCount, setMineCount] = useState(10)
  const [gameKey, setGameKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const startGame = (diff: string, w?: number, h?: number, mines?: number) => {
    setDifficulty(diff)
    setWidth(w ?? 9)
    setHeight(h ?? 9)
    setMineCount(mines ?? 10)
    setGameKey(k => k + 1)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <GameBoard key={gameKey} width={width} height={height} mineCount={mineCount} difficulty={difficulty} onOpenMenu={() => setMenuOpen(true)} />
      <SimpleBottomSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <GameMenu
          onClose={() => setMenuOpen(false)}
          onStartGame={startGame}
          onNewGame={() => setGameKey(k => k + 1)}
          currentDifficulty={difficulty}
        />
      </SimpleBottomSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
```

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/screens/GameScreen.tsx apps/mobile/src/components/GameBoard.tsx apps/mobile/src/components/GameHeader.tsx apps/mobile/src/components/MineCounter.tsx apps/mobile/src/components/SimpleBottomSheet.tsx apps/mobile/src/components/ResultModal.tsx
git commit -m "feat(mobile): add GameScreen with board, timer, header, menu, and result modal"
```

---

### Task 9: LeaderboardScreen

**Files:**
- Create: `apps/mobile/src/screens/LeaderboardScreen.tsx`

- [ ] **Step 1: Create `LeaderboardScreen.tsx`**

Same UI as web: difficulty picker, period filter, paginated list of entries with rank, player name, time, date. Uses `api.leaderboard.list()`.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/screens/LeaderboardScreen.tsx
git commit -m "feat(mobile): add LeaderboardScreen with filters and pagination"
```

---

### Task 10: ProfileScreen

**Files:**
- Create: `apps/mobile/src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Create `ProfileScreen.tsx`**

Shows user profile (username, XP, level), stats (games played, won, lost, win rate, best times), achievement grid. If not logged in, shows auth prompt.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/screens/ProfileScreen.tsx
git commit -m "feat(mobile): add ProfileScreen with stats and achievements"
```

---

### Task 11: AuthScreen + SetupUsername

**Files:**
- Create: `apps/mobile/src/screens/AuthScreen.tsx`
- Create: `apps/mobile/src/screens/SetupUsernameScreen.tsx`

- [ ] **Step 1: Create `AuthScreen.tsx`**

Email/password form with sign-in/sign-up toggle + OAuth buttons (Google, GitHub, Apple disabled).

- [ ] **Step 2: Create `SetupUsernameScreen.tsx`**

Username input with availability check, optional full name.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/screens/AuthScreen.tsx apps/mobile/src/screens/SetupUsernameScreen.tsx
git commit -m "feat(mobile): add Auth and SetupUsername screens"
```

---

### Task 12: App Entry Point (App.tsx)

**Files:**
- Create: `apps/mobile/App.tsx`

- [ ] **Step 1: Create `App.tsx`**

```tsx
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/contexts/AuthContext'
import { ThemeProvider } from './src/contexts/ThemeContext'
import { I18nProvider } from './src/contexts/I18nContext'
import { RootNavigator } from './src/navigation/RootNavigator'

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/App.tsx
git commit -m "feat(mobile): create App.tsx entry point with all providers and navigation"
```

---

### Task 13: Offline-first Integration

**Files:**
- Modify: `apps/mobile/src/services/gameSync.ts` (create)
- Modify: `apps/mobile/src/hooks/useApiGame.ts` (create)

- [ ] **Step 1: Create `apps/mobile/src/hooks/useApiGame.ts`**

Wrapper around `useGame` that adds auto-save to AsyncStorage, auto-sync to cloud on completion.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/hooks/useApiGame.ts apps/mobile/src/services/gameSync.ts
git commit -m "feat(mobile): add offline-first game sync with AsyncStorage"
```

---

## Spec Coverage

| Spec Section | Task(s) |
|---|---|
| RF-001 Autenticação | Task 6 (AuthContext), Task 11 (AuthScreen) |
| RF-002 Jogo Clássico | Task 5 (CellView), Task 8 (GameBoard, GameHeader) |
| RF-003 Dificuldades | Task 8 (GameMenu) |
| RF-004 Salvamento | Task 2 (storage), Task 13 (gameSync) |
| RF-005 Leaderboard | Task 9 (LeaderboardScreen) |
| RF-006 Estatísticas | Task 10 (ProfileScreen) |
| RF-007 XP/Níveis | Task 8 (xpEarned calc), Task 10 (display) |
| RF-008 Conquistas | Task 10 (ProfileScreen display) |
| RF-009 Perfil | Task 10 (ProfileScreen) |
| RF-011 i18n | Task 3 (I18nContext + messages) |
| RF-012 Offline | Task 2 (sync), Task 13 (gameSync) |
| RNF-005 Acessibilidade | CellView accessibilityRole/label, ResultModal aria-modal |
| Design System | Task 3 (ThemeContext colors), Task 4 (icons) |
| Navigation | Task 7 (RootNavigator) |
