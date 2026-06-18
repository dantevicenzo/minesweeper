const MIN_TIME_BY_DIFFICULTY: Record<string, number> = {
  easy: 1000,
  medium: 3000,
  hard: 8000,
}

const DEFAULT_MIN_TIME = 1000
const TIMESTAMP_TOLERANCE_MS = 5000

export function validateGameTime(
  durationMs: number,
  difficulty: string,
  width: number,
  height: number,
  mineCount?: number,
): { valid: boolean; reason?: string } {
  const minForDifficulty = MIN_TIME_BY_DIFFICULTY[difficulty] ?? DEFAULT_MIN_TIME

  const safeCells = Math.max(1, (width * height) - (mineCount ?? Math.ceil(width * height * 0.2)))
  const minForSize = Math.max(1000, safeCells * 50)
  const minTime = Math.max(minForDifficulty, minForSize)

  if (durationMs < minTime) {
    return {
      valid: false,
      reason: `Completion time (${durationMs}ms) is below minimum threshold (${minTime}ms) for ${difficulty} (${width}x${height}, ${safeCells} safe cells). Possible cheating detected.`,
    }
  }

  return { valid: true }
}

export function validateTimeConsistency(
  startedAt: string,
  serverCompletedAt: Date,
  reportedDurationMs: number,
): { valid: boolean; reason?: string } {
  const startMs = new Date(startedAt).getTime()
  const elapsedMs = serverCompletedAt.getTime() - startMs

  const diff = Math.abs(elapsedMs - reportedDurationMs)

  if (diff > TIMESTAMP_TOLERANCE_MS) {
    return {
      valid: false,
      reason: `Time inconsistency: reported ${reportedDurationMs}ms, server measured ${elapsedMs}ms (diff ${diff}ms > ${TIMESTAMP_TOLERANCE_MS}ms tolerance).`,
    }
  }

  return { valid: true }
}
