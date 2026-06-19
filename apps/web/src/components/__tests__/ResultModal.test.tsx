import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ResultModal } from '../ResultModal'

vi.mock('../icons', () => ({
  GlassesIcon: ({ className }: { className?: string }) => <svg data-testid="glasses-icon" className={className} />,
  XeyesIcon: ({ className }: { className?: string }) => <svg data-testid="xeyes-icon" className={className} />,
}))

vi.mock('../ResultModal.module.css', () => ({
  default: {
    backdrop: 'backdrop',
    modal: 'modal',
    emoji: 'emoji',
    emojiIcon: 'emojiIcon',
    title: 'title',
    section: 'section',
    sectionTitle: 'sectionTitle',
    statRow: 'statRow',
    statLabel: 'statLabel',
    statValue: 'statValue',
    xpRow: 'xpRow',
    btn: 'btn',
    srOnly: 'srOnly',
  },
}))

vi.mock('../../contexts/I18nContext', () => ({
  useI18n: () => ({
    t: {
      game: {
        win: 'You Win!',
        lose: 'Game Over',
        time: 'Time',
        mines: 'Mines',
        stats: 'Statistics',
        board: 'Board',
        clicks: 'Clicks',
        xpEarned: 'XP Earned',
        playAgain: 'Play Again',
      },
    },
  }),
}))

beforeEach(() => {
  cleanup()
})

const defaultProps = {
  status: 'won' as const,
  time: 45,
  difficulty: 'easy',
  mineCount: 10,
  flagCount: 3,
  clickCount: 23,
  width: 9,
  height: 9,
  onPlayAgain: vi.fn(),
}

describe('ResultModal', () => {
  it('renders glasses icon and win title', () => {
    render(<ResultModal {...defaultProps} />)
    expect(screen.getByTestId('glasses-icon')).toBeDefined()
    expect(screen.getByText('You Win!')).toBeDefined()
  })

  it('renders xeyes icon and lose title', () => {
    render(<ResultModal {...defaultProps} status="lost" />)
    expect(screen.getByTestId('xeyes-icon')).toBeDefined()
    expect(screen.getByText('Game Over')).toBeDefined()
  })

  it('renders stats section', () => {
    render(<ResultModal {...defaultProps} />)
    expect(screen.getByText('Statistics')).toBeDefined()
    expect(screen.getByText('45s')).toBeDefined()
    expect(screen.getByText('9×9')).toBeDefined()
    expect(screen.getByText('10/3')).toBeDefined()
    expect(screen.getByText('23')).toBeDefined()
  })

  it('renders XP section when xpEarned is provided', () => {
    render(<ResultModal {...defaultProps} xpEarned={100} />)
    expect(screen.getByText('XP Earned')).toBeDefined()
    expect(screen.getByText('+100')).toBeDefined()
  })

  it('does not render XP section when xpEarned is undefined', () => {
    render(<ResultModal {...defaultProps} xpEarned={undefined} />)
    expect(screen.queryByText('XP Earned')).toBeNull()
  })

  it('renders play again button', () => {
    render(<ResultModal {...defaultProps} />)
    expect(screen.getByText('Play Again')).toBeDefined()
  })

  it('calls onPlayAgain on button click', () => {
    const onPlayAgain = vi.fn()
    render(<ResultModal {...defaultProps} onPlayAgain={onPlayAgain} />)
    fireEvent.click(screen.getByText('Play Again'))
    expect(onPlayAgain).toHaveBeenCalledTimes(1)
  })

  it('has dialog role with aria-modal', () => {
    render(<ResultModal {...defaultProps} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('calls onPlayAgain on Escape key', () => {
    const onPlayAgain = vi.fn()
    render(<ResultModal {...defaultProps} onPlayAgain={onPlayAgain} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onPlayAgain).toHaveBeenCalledTimes(1)
  })
})
