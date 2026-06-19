import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { BottomSheet } from '../BottomSheet'

afterEach(cleanup)

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
