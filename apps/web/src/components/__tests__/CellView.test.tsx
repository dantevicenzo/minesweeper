import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { CellView } from '../CellView'

vi.mock('../CellView.module.css', () => ({
  default: {
    cell: 'cell',
    hidden: 'hidden',
    revealed: 'revealed',
    mine: 'mine',
    mineExploded: 'mineExploded',
    flagged: 'flagged',
    mineIcon: 'mineIcon',
    flagIcon: 'flagIcon',
    numberIcon: 'numberIcon',
  },
}))

function createCell(overrides: Record<string, unknown> = {}) {
  return {
    hasMine: false,
    isRevealed: false,
    isFlagged: false,
    adjacentMines: 0,
    isExploded: false,
    row: 0,
    col: 0,
    ...overrides,
  } as any
}

function renderCell(cell: ReturnType<typeof createCell>, props: Record<string, unknown> = {}) {
  return render(
    <CellView
      cell={cell}
      row={0}
      col={0}
      gameStatus="in_progress"
      isFocused={false}
      onLeftClick={vi.fn()}
      onRightClick={vi.fn()}
      onChordClick={vi.fn()}
      onMouseDown={vi.fn()}
      onMouseUp={vi.fn()}
      onFocus={vi.fn()}
      {...props}
    />
  )
}

describe('CellView', () => {
  beforeEach(() => {
    cleanup()
  })
  it('renders hidden cell', () => {
    const cell = createCell()
    renderCell(cell)
    const btn = screen.getByRole('gridcell')
    expect(btn).toBeDefined()
    expect(btn.getAttribute('aria-label')).toBe('hidden')
    expect(btn.textContent).toBe('')
  })

  it('renders flagged cell', () => {
    const cell = createCell({ isFlagged: true })
    renderCell(cell)
    const btn = screen.getByRole('gridcell')
    expect(btn.getAttribute('aria-label')).toBe('flagged')
    expect(btn.querySelector('svg')).toBeTruthy()
  })

  it('renders revealed empty cell', () => {
    const cell = createCell({ isRevealed: true })
    renderCell(cell)
    const btn = screen.getByRole('gridcell')
    expect(btn.getAttribute('aria-label')).toBe('empty')
    expect(btn.textContent).toBe('')
  })

  it('renders revealed numbered cell', () => {
    const cell = createCell({ isRevealed: true, adjacentMines: 3 })
    renderCell(cell)
    const btn = screen.getByRole('gridcell')
    expect(btn.getAttribute('aria-label')).toBe('3')
    expect(btn.querySelector('svg')).toBeTruthy()
  })

  it('renders mine cell', () => {
    const cell = createCell({ isRevealed: true, hasMine: true })
    renderCell(cell)
    const btn = screen.getByRole('gridcell')
    expect(btn.getAttribute('aria-label')).toBe('mine')
    expect(btn.querySelector('svg')).toBeTruthy()
  })

  it('renders exploded mine cell', () => {
    const cell = createCell({ isRevealed: true, hasMine: true, isExploded: true })
    renderCell(cell)
    const btn = screen.getByRole('gridcell')
    expect(btn.querySelector('svg')).toBeTruthy()
  })

  it('calls onLeftClick on click for hidden cell', () => {
    const onLeftClick = vi.fn()
    const cell = createCell()
    renderCell(cell, { onLeftClick })
    fireEvent.click(screen.getByRole('gridcell'))
    expect(onLeftClick).toHaveBeenCalledTimes(1)
  })

  it('calls onChordClick on click for revealed numbered cell', () => {
    const onChordClick = vi.fn()
    const cell = createCell({ isRevealed: true, adjacentMines: 3 })
    renderCell(cell, { onChordClick })
    fireEvent.click(screen.getByRole('gridcell'))
    expect(onChordClick).toHaveBeenCalledTimes(1)
  })

  it('calls onRightClick on context menu', () => {
    const onRightClick = vi.fn()
    const cell = createCell()
    renderCell(cell, { onRightClick })
    fireEvent.contextMenu(screen.getByRole('gridcell'))
    expect(onRightClick).toHaveBeenCalledTimes(1)
  })

  it('has correct role and tabindex', () => {
    const cell = createCell()
    renderCell(cell, { isFocused: true })
    const btn = screen.getByRole('gridcell')
    expect(btn.getAttribute('tabindex')).toBe('0')
  })

  it('has tabindex -1 when not focused', () => {
    const cell = createCell()
    renderCell(cell, { isFocused: false })
    const btn = screen.getByRole('gridcell')
    expect(btn.getAttribute('tabindex')).toBe('-1')
  })

  it('sets data attributes for row and col', () => {
    const cell = createCell()
    renderCell(cell, { row: 5, col: 3 })
    const btn = screen.getByRole('gridcell')
    expect(btn.getAttribute('data-row')).toBe('5')
    expect(btn.getAttribute('data-col')).toBe('3')
  })
})
