jest.mock('../../lib/api', () => ({
  api: {
    games: {
      create: jest.fn(),
      update: jest.fn(),
      list: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { api } from '../../lib/api'
import { saveGameToCloud, saveCompletedGameToCloud } from '../gameSync'
import type { GameState } from '@minesweeper/engine'

const mockGame: GameState = {
  board: [],
  status: 'playing',
  width: 9,
  height: 9,
  mineCount: 10,
  flagCount: 0,
  startTime: Date.now(),
  elapsedTime: 1000,
  minesPlaced: true,
}

describe('saveGameToCloud', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls create when gameId is null', async () => {
    ;(api.games.create as jest.Mock).mockResolvedValue({ id: 'new-id' })

    const result = await saveGameToCloud(mockGame, 'easy', null)

    expect(api.games.create).toHaveBeenCalledWith({
      width: 9,
      height: 9,
      mineCount: 10,
      difficulty: 'easy',
      board: JSON.stringify([]),
      flagCount: 0,
      startTime: mockGame.startTime,
      elapsedTime: 1000,
      minesPlaced: true,
    })
    expect(result).toBe('new-id')
  })

  it('calls update when gameId exists', async () => {
    await saveGameToCloud(mockGame, 'easy', 'existing-id')

    expect(api.games.update).toHaveBeenCalledWith(
      'existing-id',
      expect.objectContaining({
        difficulty: 'easy',
        width: 9,
        height: 9,
      }),
    )
    expect(api.games.create).not.toHaveBeenCalled()
  })

  it('returns gameId on successful update', async () => {
    const result = await saveGameToCloud(mockGame, 'easy', 'existing-id')

    expect(result).toBe('existing-id')
  })

  it('returns null on error during create', async () => {
    ;(api.games.create as jest.Mock).mockRejectedValue(new Error('offline'))

    const result = await saveGameToCloud(mockGame, 'easy', null)

    expect(result).toBeNull()
  })

  it('returns existing gameId on error during update', async () => {
    ;(api.games.update as jest.Mock).mockRejectedValue(new Error('offline'))

    const result = await saveGameToCloud(mockGame, 'easy', 'existing-id')

    expect(result).toBe('existing-id')
  })
})

describe('saveCompletedGameToCloud', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('includes status, completed_at, and duration_ms', async () => {
    await saveCompletedGameToCloud(mockGame, 'easy', 'existing-id')

    expect(api.games.update).toHaveBeenCalledWith(
      'existing-id',
      expect.objectContaining({
        status: 'playing',
        completed_at: expect.any(String),
        duration_ms: 1000,
      }),
    )
  })

  it('calls create when no existingId', async () => {
    ;(api.games.create as jest.Mock).mockResolvedValue({ id: 'completed-id' })

    const result = await saveCompletedGameToCloud(mockGame, 'easy', null)

    expect(api.games.create).toHaveBeenCalled()
    expect(result).toBe('completed-id')
  })

  it('returns existingId on successful update', async () => {
    const result = await saveCompletedGameToCloud(mockGame, 'easy', 'existing-id')

    expect(result).toBe('existing-id')
  })

  it('returns existingId on error during update', async () => {
    ;(api.games.update as jest.Mock).mockRejectedValue(new Error('offline'))

    const result = await saveCompletedGameToCloud(mockGame, 'easy', 'existing-id')

    expect(result).toBe('existing-id')
  })

  it('returns null on error during create', async () => {
    ;(api.games.create as jest.Mock).mockRejectedValue(new Error('offline'))

    const result = await saveCompletedGameToCloud(mockGame, 'easy', null)

    expect(result).toBeNull()
  })
})
