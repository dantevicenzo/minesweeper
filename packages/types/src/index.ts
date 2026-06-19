export type {
  Cell,
  Board,
  GameStatus,
  GameState,
  GameAction,
  Position,
} from '@minesweeper/engine'

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  email: string | null
  avatar_url: string | null
  xp: number
  level: number
  banned: boolean
  created_at: string
  updated_at: string
}
