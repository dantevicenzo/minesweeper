import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { ProfileScreen } from '../screens/ProfileScreen'
import { ThemeProvider } from '../contexts/ThemeContext'
import { I18nProvider } from '../contexts/I18nContext'
import { api } from '../lib/api'
import type { Profile } from '@minesweeper/types'

const mockProfile: Profile = {
  id: 'user-1',
  username: 'testuser',
  full_name: 'Test User',
  email: 'test@test.com',
  avatar_url: null,
  xp: 1200,
  level: 5,
  banned: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const mockStats = {
  games_played: 50,
  wins: 30,
  losses: 20,
  win_rate: 0.6,
  best_time: 45,
}

const mockAchievements = [
  { id: 'ach-1', key: 'first_win', unlocked_at: '2026-01-01T00:00:00Z' },
  { id: 'ach-2', key: 'speed_demon_easy', unlocked_at: null },
]

let mockUser: { id: string; email: string } | null = { id: 'user-1', email: 'test@test.com' }

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    signOut: jest.fn(),
  }),
}))

jest.mock('../lib/api', () => ({
  api: {
    profiles: { me: jest.fn() },
    stats: { me: jest.fn() },
    achievements: { me: jest.fn() },
  },
}))

const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <I18nProvider>{ui}</I18nProvider>
    </ThemeProvider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUser = { id: 'user-1', email: 'test@test.com' }
})

describe('ProfileScreen', () => {
  it('shows login prompt when not logged in', () => {
    mockUser = null
    const { getByText } = renderWithProviders(<ProfileScreen />)
    expect(getByText('Sign In')).toBeTruthy()
  })

  it('navigates to Auth when sign in pressed', () => {
    mockUser = null
    const { getByText } = renderWithProviders(<ProfileScreen />)
    fireEvent.press(getByText('Sign In'))
    expect(mockNavigate).toHaveBeenCalledWith('Auth')
  })

  it('shows loading indicator on mount when logged in', () => {
    (api.profiles.me as jest.Mock).mockReturnValue(new Promise(() => {}))
    const { getByTestId } = renderWithProviders(<ProfileScreen />)
    expect(getByTestId('loading-indicator')).toBeTruthy()
  })

  it('renders profile data after successful fetch', async () => {
    ;(api.profiles.me as jest.Mock).mockResolvedValue({ profile: mockProfile })
    ;(api.stats.me as jest.Mock).mockResolvedValue(mockStats)
    ;(api.achievements.me as jest.Mock).mockResolvedValue(mockAchievements)
    const { getByText, getAllByText, queryByTestId } = renderWithProviders(<ProfileScreen />)
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull()
    })
    expect(getByText('testuser')).toBeTruthy()
    expect(getByText(/1200/)).toBeTruthy()
    expect(getByText('50')).toBeTruthy()
    expect(getAllByText(/30/).length).toBeGreaterThanOrEqual(1)
    expect(getByText('20')).toBeTruthy()
    expect(getByText('60%')).toBeTruthy()
  })

  it('renders achievements with unlocked/locked state', async () => {
    ;(api.profiles.me as jest.Mock).mockResolvedValue({ profile: mockProfile })
    ;(api.stats.me as jest.Mock).mockResolvedValue(mockStats)
    ;(api.achievements.me as jest.Mock).mockResolvedValue(mockAchievements)
    const { getByText, queryByTestId } = renderWithProviders(<ProfileScreen />)
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull()
    })
    expect(getByText('First Win')).toBeTruthy()
    expect(getByText('Speed Demon')).toBeTruthy()
  })

  it('shows error state when fetch fails', async () => {
    ;(api.profiles.me as jest.Mock).mockRejectedValue(new Error('API error'))
    const { getByText } = renderWithProviders(<ProfileScreen />)
    await waitFor(() => {
      expect(getByText('API error')).toBeTruthy()
    })
  })

  it('renders sign out button when logged in', async () => {
    ;(api.profiles.me as jest.Mock).mockResolvedValue({ profile: mockProfile })
    ;(api.stats.me as jest.Mock).mockResolvedValue(mockStats)
    ;(api.achievements.me as jest.Mock).mockResolvedValue(mockAchievements)
    const { getByText } = renderWithProviders(<ProfileScreen />)
    await waitFor(() => {
      expect(getByText('Sign Out')).toBeTruthy()
    })
  })
})
