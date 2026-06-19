# Endgame Result Modal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a result modal overlay when the game ends (win/loss) with time, stats, XP, and a "Play Again" button.

**Architecture:** New `ResultModal` component rendered conditionally inside `GameBoard`. Click count tracked via ref in `GameBoard`. XP calculated locally from difficulty. Modal positioned with absolute positioning + backdrop inside the board container.

**Tech Stack:** React, CSS Modules, Vitest, @testing-library/react

## Global Constraints

- Follow existing CSS Modules pattern (mock in tests)
- Use existing i18n pattern (`useI18n` context)
- All existing tests must continue to pass
- No new dependencies

---

### Task 1: Add i18n keys for result screen

**Files:**
- Modify: `apps/web/src/messages/en.json`
- Modify: `apps/web/src/messages/pt-BR.json`
- No tests needed (static JSON)

- [ ] **Step 1: Add new keys to en.json**

Add after line 33 (`boardLabel` key):

```json
    "stats": "Statistics",
    "board": "Board",
    "clicks": "Clicks",
    "xpEarned": "XP Earned",
    "playAgain": "Play Again"
```

- [ ] **Step 2: Add Portuguese translations to pt-BR.json**

```json
    "stats": "Estatísticas",
    "board": "Tabuleiro",
    "clicks": "Cliques",
    "xpEarned": "EXP Ganho",
    "playAgain": "Jogar Novamente"
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/messages/en.json apps/web/src/messages/pt-BR.json
git commit -m "feat: add i18n keys for endgame result modal"
```

---

### Task 2: Create ResultModal component

**Files:**
- Create: `apps/web/src/components/ResultModal.tsx`
- Create: `apps/web/src/components/ResultModal.module.css`
- Create: `apps/web/src/components/__tests__/ResultModal.test.tsx`

**Interfaces:**
- Consumes: `useI18n` context
- Produces: `<ResultModal>` with props:
  - `status: 'won' | 'lost'`
  - `time: number`
  - `difficulty: string`
  - `mineCount: number`
  - `flagCount: number`
  - `clickCount: number`
  - `width: number`
  - `height: number`
  - `xpEarned?: number`
  - `onPlayAgain: () => void`

- [ ] **Step 1: Write the failing test**

`apps/web/src/components/__tests__/ResultModal.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ResultModal } from '../ResultModal'

vi.mock('../ResultModal.module.css', () => ({
  default: {
    backdrop: 'backdrop',
    modal: 'modal',
    emoji: 'emoji',
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
  it('renders win emoji and title', () => {
    render(<ResultModal {...defaultProps} />)
    expect(screen.getByText('😎')).toBeDefined()
    expect(screen.getByText('You Win!')).toBeDefined()
  })

  it('renders lose emoji and title', () => {
    render(<ResultModal {...defaultProps} status="lost" />)
    expect(screen.getByText('💀')).toBeDefined()
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
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/components/__tests__/ResultModal.test.tsx`
Expected: FAIL, component not found

- [ ] **Step 3: Create ResultModal component**

`apps/web/src/components/ResultModal.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { useI18n } from '../contexts/I18nContext'
import styles from './ResultModal.module.css'

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

export function ResultModal({ status, time, difficulty, mineCount, flagCount, clickCount, width, height, xpEarned, onPlayAgain }: ResultModalProps) {
  const { t } = useI18n()
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    btnRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onPlayAgain()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onPlayAgain])

  return (
    <>
      <div className={styles.backdrop} />
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="result-title">
        <div className={styles.emoji}>{status === 'won' ? '😎' : '💀'}</div>
        <h2 id="result-title" className={styles.title}>{status === 'won' ? t.game.win : t.game.lose}</h2>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>{t.game.stats}</div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>{t.game.time}</span>
            <span className={styles.statValue}>{time}s</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>{t.game.board}</span>
            <span className={styles.statValue}>{width}×{height}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>{t.game.mines}</span>
            <span className={styles.statValue}>{mineCount}/{flagCount}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>{t.game.clicks}</span>
            <span className={styles.statValue}>{clickCount}</span>
          </div>
        </div>

        {xpEarned != null && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>{t.game.xpEarned}</div>
            <div className={styles.xpRow}>+{xpEarned}</div>
          </div>
        )}

        <button ref={btnRef} className={styles.btn} onClick={onPlayAgain}>
          {t.game.playAgain}
        </button>

        <div className={styles.srOnly} role="status" aria-live="polite">
          {status === 'won' ? t.game.win : t.game.lose} {t.game.time}: {time}s
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Create ResultModal CSS**

`apps/web/src/components/ResultModal.module.css`:

```css
.backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 50;
  animation: fadeIn 0.15s ease-out;
}

.modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 51;
  background: var(--color-surface, #fff);
  border-radius: 12px;
  padding: 24px;
  min-width: 220px;
  max-width: 90%;
  text-align: center;
  animation: scaleIn 0.2s ease-out;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.emoji {
  font-size: 40px;
  line-height: 1;
  margin-bottom: 4px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 16px;
  color: var(--color-text, #1a1a1a);
}

.section {
  margin-bottom: 12px;
}

.sectionTitle {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary, #666);
  margin-bottom: 6px;
}

.statRow {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 14px;
}

.statLabel {
  color: var(--color-text-secondary, #666);
}

.statValue {
  font-weight: 600;
  color: var(--color-text, #1a1a1a);
}

.xpRow {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary, #2563eb);
}

.btn {
  margin-top: 16px;
  width: 100%;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: var(--color-primary, #2563eb);
  color: #fff;
  cursor: pointer;
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary, #2563eb);
  outline-offset: 2px;
}

.btn:active {
  opacity: 0.85;
}

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/components/__tests__/ResultModal.test.tsx`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ResultModal.tsx apps/web/src/components/ResultModal.module.css apps/web/src/components/__tests__/ResultModal.test.tsx
git commit -m "feat: add ResultModal component with stats and XP display"
```

---

### Task 3: Integrate ResultModal into GameBoard

**Files:**
- Modify: `apps/web/src/components/GameBoard.tsx`
- Modify: `apps/web/src/components/__tests__/GameBoard.test.tsx`
- No new files

- [ ] **Step 1: Update test mocks to include new i18n keys, useAuth, and ResultModal mock**

In `apps/web/src/components/__tests__/GameBoard.test.tsx`, add `useAuth` mock before the other mocks:

```tsx
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null })),
}))
```

Update the i18n mock to include the new `game` properties:

```tsx
vi.mock('../../contexts/I18nContext', () => ({
  useI18n: () => ({
    t: {
      game: {
        mines: 'Mines',
        time: 'Time',
        win: 'You Win!',
        lose: 'Game Over',
        newGame: 'New Game',
        minesweeperBoard: 'Minesweeper board',
        boardLabel: 'Game grid. Use arrow keys to navigate, Enter to reveal, F to flag.',
        stats: 'Statistics',
        board: 'Board',
        clicks: 'Clicks',
        xpEarned: 'XP Earned',
        playAgain: 'Play Again',
      },
      home: {
        settings: 'Settings',
        profile: 'Profile',
        leaderboard: 'Leaderboard',
      },
    },
  }),
}))
```

Add ResultModal mock after the CellView mock:

```tsx
vi.mock('../ResultModal', () => ({
  ResultModal: vi.fn(() => null),
}))
```

Add imports at the bottom:

```tsx
import { useAuth } from '../../contexts/AuthContext'
import { ResultModal } from '../ResultModal'
```

- [ ] **Step 2: Write failing tests for ResultModal integration in GameBoard**

Add these tests at the end of `apps/web/src/components/__tests__/GameBoard.test.tsx`:

```tsx
describe('GameBoard with ResultModal', () => {
  beforeEach(() => {
    vi.mocked(ResultModal).mockClear()
  })

  it('does not show modal when game is idle', () => {
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'idle' }),
      dispatch: vi.fn(),
      reset: vi.fn(),
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} />)
    expect(vi.mocked(ResultModal)).not.toHaveBeenCalled()
  })

  it('shows modal when game is won', () => {
    const reset = vi.fn()
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'won', flagCount: 3, startTime: Date.now() - 45000 }),
      dispatch: vi.fn(),
      reset,
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} difficulty="easy" />)
    expect(vi.mocked(ResultModal)).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'won',
        mineCount: 10,
        flagCount: 3,
        difficulty: 'easy',
        width: 9,
        height: 9,
      }),
      expect.anything(),
    )
  })

  it('shows modal when game is lost', () => {
    const reset = vi.fn()
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'lost', flagCount: 2, startTime: Date.now() - 30000 }),
      dispatch: vi.fn(),
      reset,
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} difficulty="medium" />)
    expect(vi.mocked(ResultModal)).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'lost',
        mineCount: 10,
        flagCount: 2,
        difficulty: 'medium',
      }),
      expect.anything(),
    )
  })

  it('passes xpEarned=100 for easy win with logged user', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'test' } } as any)
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'won', flagCount: 3, startTime: Date.now() - 45000 }),
      dispatch: vi.fn(),
      reset: vi.fn(),
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} difficulty="easy" />)
    const lastCall = vi.mocked(ResultModal).mock.calls[vi.mocked(ResultModal).mock.calls.length - 1]
    expect(lastCall[0].xpEarned).toBe(100)
  })

  it('calls reset when onPlayAgain is triggered', () => {
    const reset = vi.fn()
    vi.mocked(useApiGame).mockReturnValue({
      game: createMockGame({ status: 'won', flagCount: 3, startTime: Date.now() - 45000 }),
      dispatch: vi.fn(),
      reset,
    } as any)

    render(<GameBoard width={9} height={9} mineCount={10} difficulty="easy" />)
    const lastCall = vi.mocked(ResultModal).mock.calls[vi.mocked(ResultModal).mock.calls.length - 1]
    lastCall[0].onPlayAgain()
    expect(reset).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/components/__tests__/GameBoard.test.tsx`
Expected: FAIL (ResultModal component not rendered yet)

- [ ] **Step 4: Modify GameBoard to integrate ResultModal**

Add imports at top of `apps/web/src/components/GameBoard.tsx`:

```tsx
import { ResultModal } from './ResultModal'
import { useAuth } from '../contexts/AuthContext'
```

Add inside the component function, after existing state declarations:

```tsx
const { user } = useAuth()
const clickCountRef = useRef(0)
const [showResult, setShowResult] = useState(false)
```

Add effect to show modal when game ends (after the existing face effect):

```tsx
useEffect(() => {
  if (game.status === 'won' || game.status === 'lost') {
    setShowResult(true)
  } else {
    setShowResult(false)
  }
}, [game.status])
```

Wrap the `wrappedDispatch` to count clicks:

Change the existing `wrappedDispatch` to:

```tsx
const wrappedDispatch = useCallback((action: GameAction) => {
  clickCountRef.current += 1
  dispatch(action)
}, [dispatch])
```

Update `wrappedReset` to also reset click count and hide modal:

```tsx
const wrappedReset = useCallback(() => {
  gameIdRef.current = null
  statusRef.current = 'idle'
  clearSavedGame()
  setShowResult(false)
  clickCountRef.current = 0
  reset()
}, [reset])
```

Add XP calculation. Add this before the return statement:

```tsx
const xpMap: Record<string, number> = { easy: 100, medium: 150, hard: 200 }
const xpEarned = user && game.status === 'won' ? (xpMap[difficulty] ?? 100) : undefined
```

Add ResultModal render after the closing `</div>` of the scaler, before the closing `</div>` of the wrapper. Or better, inside the wrapper but after the container:

After line 284 (`</div>` - closing scaler), before line 285 (`</div>` - closing wrapper):

```tsx
{showResult && (
  <ResultModal
    status={game.status as 'won' | 'lost'}
    time={time}
    difficulty={difficulty}
    mineCount={mineCount}
    flagCount={game.flagCount}
    clickCount={clickCountRef.current}
    width={width}
    height={height}
    xpEarned={xpEarned}
    onPlayAgain={wrappedReset}
  />
)}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/components/__tests__/GameBoard.test.tsx`
Expected: All tests pass (both existing and new)

- [ ] **Step 6: Run full test suite to verify no regressions**

Run: `cd apps/web && npx vitest run`
Expected: All tests pass

- [ ] **Step 7: Run typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/GameBoard.tsx apps/web/src/components/__tests__/GameBoard.test.tsx
git commit -m "feat: integrate ResultModal into GameBoard with click tracking and XP"
```
