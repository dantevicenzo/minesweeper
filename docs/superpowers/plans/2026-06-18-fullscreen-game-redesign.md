# Full-Screen Game Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `/` the full-screen game with gear menu and flag toggle

**Architecture:** Home page becomes the game. BottomSheet component overlays the game with menu items. FlagMode state toggles cell click behavior.

**Tech Stack:** Next.js 15, CSS Modules, React context

## Global Constraints

- All existing routes preserved (leaderboard, profile, auth)
- `/settings` page removed (language/theme inline in gear menu)
- `/game` redirects to `/`
- Right-click always flags regardless of toggle state

---

### Task 1: BottomSheet component

**Files:**
- Create: `apps/web/src/components/BottomSheet.tsx`
- Create: `apps/web/src/components/BottomSheet.module.css`
- Test: `apps/web/src/components/__tests__/BottomSheet.test.tsx`

**Interfaces:**
- Consumes: `isOpen: boolean`, `onClose: () => void`, `children: ReactNode`
- Produces: `<BottomSheet>` component with open/close animation, backdrop click, swipe down

**Steps:**

- [ ] Write BottomSheet.module.css:
```css
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  animation: fadeIn 0.15s ease-out;
}

.sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 75vh;
  background: var(--color-surface, #fff);
  border-radius: 16px 16px 0 0;
  z-index: 101;
  overflow-y: auto;
  animation: slideUp 0.2s ease-out;
  padding: 16px 20px 24px;
}

.handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border, #d4d4d4);
  margin: 0 auto 16px;
}

.closeBtn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 20px;
  color: var(--color-text-secondary, #666);
  cursor: pointer;
  padding: 4px;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] Write BottomSheet.tsx:
```tsx
'use client'

import { useEffect, useCallback, type ReactNode } from 'react'
import styles from './BottomSheet.module.css'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet} role="dialog" aria-modal="true">
        <div className={styles.handle} />
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        {children}
      </div>
    </>
  )
}
```

- [ ] Write BottomSheet.test.tsx:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BottomSheet } from '../BottomSheet'

describe('BottomSheet', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<BottomSheet isOpen={false} onClose={vi.fn()}>content</BottomSheet>)
    expect(container.innerHTML).toBe('')
  })

  it('renders content when open', () => {
    render(<BottomSheet isOpen={true} onClose={vi.fn()}>Hello</BottomSheet>)
    expect(screen.getByText('Hello')).toBeDefined()
  })

  it('calls onClose on backdrop click', () => {
    const onClose = vi.fn()
    const { container } = render(<BottomSheet isOpen={true} onClose={onClose}>content</BottomSheet>)
    const backdrop = container.firstElementChild!
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn()
    render(<BottomSheet isOpen={true} onClose={onClose}>content</BottomSheet>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('has close button', () => {
    render(<BottomSheet isOpen={true} onClose={vi.fn()}>content</BottomSheet>)
    expect(screen.getByLabelText('Close')).toBeDefined()
  })
})
```

---

### Task 2: GameMenu component (bottom sheet content)

**Files:**
- Create: `apps/web/src/components/GameMenu.tsx`
- Create: `apps/web/src/components/GameMenu.module.css`

**Interfaces:**
- Consumes: `onClose: () => void`, `onStartGame: (difficulty: string, width?: number, height?: number, mineCount?: number) => void`, `onContinue: (() => void) | null`
- Uses: `useAuth`, `useI18n`, `useTheme`, `useRouter`

- [ ] Create GameMenu.module.css:
```css
.menu { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; }

.sectionLabel {
  font-size: 12px;
  color: var(--color-text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 12px 0 4px;
}

.menuBtn {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text, #1a1a1a);
  cursor: pointer;
  text-align: left;
}

.menuBtn:hover { background: var(--color-bg-secondary, #e0e0e0); }

.diffGroup {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 4px 0;
}

.diffBtn {
  flex: 1;
  min-width: 60px;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid var(--color-border, #d4d4d4);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text, #1a1a1a);
  cursor: pointer;
  text-align: center;
}

.diffBtnActive {
  background: var(--color-primary, #2563eb);
  color: white;
  border-color: var(--color-primary, #2563eb);
}

.customInputs {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.customInputs label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: var(--color-text-secondary, #666);
}

.customInputs input {
  width: 60px;
  padding: 4px 6px;
  font-size: 13px;
  border: 1px solid var(--color-border, #d4d4d4);
  border-radius: 4px;
  text-align: center;
}

.selectRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}

.selectRow label { font-size: 14px; color: var(--color-text, #1a1a1a); }

.selectRow select {
  padding: 6px 10px;
  font-size: 13px;
  border: 1px solid var(--color-border, #d4d4d4);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  color: var(--color-text, #1a1a1a);
}
```

- [ ] Create GameMenu.tsx:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useTheme } from '../contexts/ThemeContext'
import styles from './GameMenu.module.css'
import type { Locale } from '../lib/i18n'

interface GameMenuProps {
  onClose: () => void
  onStartGame: (difficulty: string, width?: number, height?: number, mineCount?: number) => void
  onContinue: (() => void) | null
}

const DIFFICULTIES = [
  { key: 'easy', labelKey: 'easy', width: 9, height: 9, mines: 10 },
  { key: 'medium', labelKey: 'medium', width: 16, height: 16, mines: 40 },
  { key: 'hard', labelKey: 'hard', width: 30, height: 16, mines: 99 },
] as const

export function GameMenu({ onClose, onStartGame, onContinue }: GameMenuProps) {
  const { t, locale, setLocale } = useI18n()
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [difficulty, setDifficulty] = useState('easy')
  const [customWidth, setCustomWidth] = useState(12)
  const [customHeight, setCustomHeight] = useState(12)
  const [customMines, setCustomMines] = useState(20)

  const diffLabel = (key: string) => {
    switch (key) {
      case 'easy': return t.game.difficulty.easy
      case 'medium': return t.game.difficulty.medium
      case 'hard': return t.game.difficulty.hard
      default: return key
    }
  }

  const handleDifficulty = (key: string) => {
    setDifficulty(key)
    if (key === 'custom') return
    const diff = DIFFICULTIES.find(d => d.key === key)!
    onStartGame(key, diff.width, diff.height, diff.mines)
    onClose()
  }

  const handleCustomStart = () => {
    onStartGame('custom', customWidth, customHeight, customMines)
    onClose()
  }

  return (
    <div className={styles.menu}>
      {onContinue && (
        <button className={styles.menuBtn} onClick={() => { onContinue(); onClose() }}>
          ▶ {t.home.continue}
        </button>
      )}

      <div className={styles.sectionLabel}>{t.game.difficulty.title ?? 'Difficulty'}</div>
      <div className={styles.diffGroup}>
        {DIFFICULTIES.map(d => (
          <button
            key={d.key}
            className={`${styles.diffBtn} ${difficulty === d.key ? styles.diffBtnActive : ''}`}
            onClick={() => handleDifficulty(d.key)}
          >
            {diffLabel(d.key)}
          </button>
        ))}
        <button
          className={`${styles.diffBtn} ${difficulty === 'custom' ? styles.diffBtnActive : ''}`}
          onClick={() => setDifficulty('custom')}
        >
          {t.game.difficulty.custom}
        </button>
      </div>

      {difficulty === 'custom' && (
        <div className={styles.customInputs}>
          <label>Width <input type="number" min={5} max={100} value={customWidth} onChange={e => setCustomWidth(Number(e.target.value))} /></label>
          <label>Height <input type="number" min={5} max={100} value={customHeight} onChange={e => setCustomHeight(Number(e.target.value))} /></label>
          <label>Mines <input type="number" min={1} max={customWidth * customHeight - 1} value={customMines} onChange={e => setCustomMines(Number(e.target.value))} /></label>
          <button className={styles.menuBtn} onClick={handleCustomStart}>▶ Start</button>
        </div>
      )}

      <button className={styles.menuBtn} onClick={() => { router.push('/leaderboard'); onClose() }}>
        {t.nav.leaderboard}
      </button>

      <button className={styles.menuBtn} onClick={() => { router.push('/profile'); onClose() }}>
        {t.nav.profile}
      </button>

      <div className={styles.sectionLabel}>{t.settings.title}</div>

      <div className={styles.selectRow}>
        <label>{t.settings.language}</label>
        <select value={locale} onChange={e => setLocale(e.target.value as Locale)}>
          <option value="en">English</option>
          <option value="pt-BR">Português</option>
        </select>
      </div>

      <div className={styles.selectRow}>
        <label>{t.settings.theme}</label>
        <select value={theme} onChange={e => setTheme(e.target.value as 'light' | 'dark')}>
          <option value="light">{t.settings.light}</option>
          <option value="dark">{t.settings.dark}</option>
        </select>
      </div>

      {user && (
        <button className={styles.menuBtn} onClick={() => { signOut(); onClose() }} style={{ color: 'var(--color-danger)' }}>
          {t.auth.signOut}
        </button>
      )}
    </div>
  )
}
```

---

### Task 3: Update GameBoard with gear + flag toggle

**Files:**
- Modify: `apps/web/src/components/GameBoard.tsx`
- Modify: `apps/web/src/components/GameBoard.module.css`

- [ ] Add `flagMode` state and pass to CellView. Add gear/flag buttons to header.

GameBoard.module.css header changes:
```css
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 8px;
  padding: 4px;
  background-color: var(--color-cell-bg);
}

.headerLeft, .headerRight {
  display: flex;
  align-items: center;
  gap: 4px;
}

.headerBtn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: 18px;
  background: var(--color-cell-bg);
  border-top: 3px solid var(--color-cell-border-light);
  border-left: 3px solid var(--color-cell-border-light);
  border-bottom: 3px solid var(--color-cell-border-dark);
  border-right: 3px solid var(--color-cell-border-dark);
  padding: 0;
}

.headerBtn:active {
  border-top: 1px solid var(--color-cell-border-dark);
  border-left: 1px solid var(--color-cell-border-dark);
  border-bottom: 1px solid var(--color-cell-border-light);
  border-right: 1px solid var(--color-cell-border-light);
}

.flagActive {
  background: var(--color-flag);
  color: white;
}
```

GameBoard.tsx changes:
```tsx
// Add prop interface
interface GameBoardProps {
  width: number
  height: number
  mineCount: number
  difficulty?: string
  initialState?: Partial<GameState>
  flagMode?: boolean
  onFlagModeChange?: (mode: boolean) => void
  onOpenMenu?: () => void
}

// Add props, default flagMode from parent state
// Header structure:
// <div className={styles.header}>
//   <div className={styles.headerLeft}>
//     <div className={styles.counter}>...
//     <button className={styles.headerBtn} onClick={onOpenMenu}>⚙️</button>
//   </div>
//   <button className={styles.smiley}>...
//   <div className={styles.headerRight}>
//     <button className={`${styles.headerBtn} ${flagMode ? styles.flagActive : ''}`}
//       onClick={() => onFlagModeChange?.(!flagMode)} aria-label="Toggle flag mode">🚩</button>
//     <div className={styles.counter}>...
//   </div>
// </div>
```

---

### Task 4: Update CellView for flag mode

**Files:**
- Modify: `apps/web/src/components/CellView.tsx`
- Modify: `apps/web/src/components/CellView.test.tsx`

- [ ] Add `flagMode` prop to CellView. When `flagMode` is true, left click triggers flag instead of reveal.

```tsx
interface CellViewProps {
  cell: Cell
  row: number
  col: number
  gameStatus: string
  isFocused: boolean
  flagMode?: boolean
  onLeftClick: () => void
  onRightClick: (e: React.MouseEvent) => void
  onChordClick: () => void
  onMouseDown: () => void
  onMouseUp: () => void
  onFocus: () => void
}

// In the click handler:
const handleClick = () => {
  if (flagMode) {
    onRightClick({ preventDefault: () => {} } as React.MouseEvent)
  } else {
    onLeftClick()
  }
}
```

---

### Task 5: Home page becomes the game

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/page.module.css`
- Modify: `apps/web/src/app/game/page.tsx`
- Modify: `apps/web/src/app/game/page.module.css`

- [ ] Rewrite `apps/web/src/app/page.tsx` to render GameBoard with full-screen layout + BottomSheet with GameMenu
- [ ] Make `apps/web/src/app/game/page.tsx` redirect to `/`
- [ ] Simplify `apps/web/src/app/game/page.module.css`

---

### Task 6: Remove settings page

**Files:**
- Remove: `apps/web/src/app/settings/page.tsx`
- Remove: `apps/web/src/app/settings/page.module.css`

- [ ] Delete the settings page files (settings are now inline in the gear menu)
- [ ] Update `apps/web/src/messages/en.json` and `pt-BR.json` to add any missing keys for nav.leaderboard, nav.profile, home.continue if not present
