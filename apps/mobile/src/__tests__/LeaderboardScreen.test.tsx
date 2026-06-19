import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { LeaderboardScreen } from '../screens/LeaderboardScreen'
import { ThemeProvider } from '../contexts/ThemeContext'
import { I18nProvider } from '../contexts/I18nContext'
import { api } from '../lib/api'

const mockEntries = [
  { id: '1', player_id: 'p1', player_name: 'Alice', time: 45, created_at: '2026-01-01T00:00:00Z', difficulty: 'easy' },
  { id: '2', player_id: 'p2', player_name: 'Bob', time: 67, created_at: '2026-01-02T00:00:00Z', difficulty: 'easy' },
]

jest.mock('../lib/api', () => ({
  api: {
    leaderboard: {
      list: jest.fn(),
    },
  },
}))

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <I18nProvider>{ui}</I18nProvider>
    </ThemeProvider>
  )
}

jest.useFakeTimers()

beforeEach(() => {
  jest.clearAllMocks()
})

describe('LeaderboardScreen', () => {
  it('shows loading indicator on mount', () => {
    (api.leaderboard.list as jest.Mock).mockReturnValue(new Promise(() => {}))
    const { getByTestId } = renderWithProviders(<LeaderboardScreen />)
    expect(getByTestId('loading-indicator')).toBeTruthy()
  })

  it('renders entries after successful fetch', async () => {
    (api.leaderboard.list as jest.Mock).mockResolvedValue({ data: mockEntries, pagination: {} })
    const { getByText, queryByTestId } = renderWithProviders(<LeaderboardScreen />)
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull()
    })
    expect(getByText('Alice')).toBeTruthy()
    expect(getByText('Bob')).toBeTruthy()
  })

  it('renders empty state when no entries', async () => {
    (api.leaderboard.list as jest.Mock).mockResolvedValue({ data: [], pagination: {} })
    const { getByText } = renderWithProviders(<LeaderboardScreen />)
    await waitFor(() => {
      expect(getByText('No entries yet')).toBeTruthy()
    })
  })

  it('renders error state with retry button', async () => {
    (api.leaderboard.list as jest.Mock).mockRejectedValue(new Error('offline'))
    const { getByText } = renderWithProviders(<LeaderboardScreen />)
    await waitFor(() => {
      expect(getByText('offline')).toBeTruthy()
    })
    expect(getByText('Retry')).toBeTruthy()
  })

  it('calls api with correct params when difficulty changes', async () => {
    (api.leaderboard.list as jest.Mock).mockResolvedValue({ data: mockEntries, pagination: {} })
    const { getByText } = renderWithProviders(<LeaderboardScreen />)
    await waitFor(() => {
      expect(api.leaderboard.list).toHaveBeenCalledWith('easy', 1, 20, 'all')
    })
    fireEvent.press(getByText('Medium'))
    await waitFor(() => {
      expect(api.leaderboard.list).toHaveBeenCalledWith('medium', 1, 20, 'all')
    })
  })

  it('calls api with correct params when period changes', async () => {
    (api.leaderboard.list as jest.Mock).mockResolvedValue({ data: mockEntries, pagination: {} })
    const { getByText } = renderWithProviders(<LeaderboardScreen />)
    await waitFor(() => {
      expect(api.leaderboard.list).toHaveBeenCalledWith('easy', 1, 20, 'all')
    })
    fireEvent.press(getByText('Today'))
    await waitFor(() => {
      expect(api.leaderboard.list).toHaveBeenCalledWith('easy', 1, 20, 'today')
    })
  })

  it('shows medal for top 3 entries', async () => {
    const top3 = [
      { id: '1', player_id: 'p1', player_name: 'Gold', time: 10, created_at: '2026-01-01T00:00:00Z', difficulty: 'easy' },
      { id: '2', player_id: 'p2', player_name: 'Silver', time: 20, created_at: '2026-01-01T00:00:00Z', difficulty: 'easy' },
      { id: '3', player_id: 'p3', player_name: 'Bronze', time: 30, created_at: '2026-01-01T00:00:00Z', difficulty: 'easy' },
    ]
    ;(api.leaderboard.list as jest.Mock).mockResolvedValue({ data: top3, pagination: {} })
    const { getByText } = renderWithProviders(<LeaderboardScreen />)
    await waitFor(() => {
      expect(getByText('🥇')).toBeTruthy()
      expect(getByText('🥈')).toBeTruthy()
      expect(getByText('🥉')).toBeTruthy()
    })
  })

  it('renders difficulty and period filter buttons', () => {
    (api.leaderboard.list as jest.Mock).mockResolvedValue({ data: [], pagination: {} })
    const { getByText } = renderWithProviders(<LeaderboardScreen />)
    expect(getByText('Easy')).toBeTruthy()
    expect(getByText('Medium')).toBeTruthy()
    expect(getByText('Hard')).toBeTruthy()
    expect(getByText('Custom')).toBeTruthy()
    expect(getByText('All Time')).toBeTruthy()
    expect(getByText('Today')).toBeTruthy()
    expect(getByText('This Week')).toBeTruthy()
    expect(getByText('This Month')).toBeTruthy()
  })

  it('retries fetch on retry button press', async () => {
    (api.leaderboard.list as jest.Mock)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: mockEntries, pagination: {} })
    const { getByText } = renderWithProviders(<LeaderboardScreen />)
    await waitFor(() => {
      expect(getByText('offline')).toBeTruthy()
    })
    fireEvent.press(getByText('Retry'))
    await waitFor(() => {
      expect(getByText('Alice')).toBeTruthy()
    })
    expect(api.leaderboard.list).toHaveBeenCalledTimes(2)
  })
})
