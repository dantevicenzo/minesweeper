'use client'

import { useEffect, type ReactNode } from 'react'
import styles from './BottomSheet.module.css'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  titleId?: string
  children: ReactNode
}

export function BottomSheet({ isOpen, onClose, title, titleId = 'sheet-title', children }: BottomSheetProps) {
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
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined}>
        <div className={styles.handle} />
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        {title && <h2 id={titleId} className={styles.title}>{title}</h2>}
        {children}
      </div>
    </>
  )
}
