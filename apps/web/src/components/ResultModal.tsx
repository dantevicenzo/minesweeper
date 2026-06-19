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
