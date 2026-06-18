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
): { valid: boolean; reason?: string } {
  const minForDifficulty = MIN_TIME_BY_DIFFICULTY[difficulty] ?? DEFAULT_MIN_TIME
  const cellCount = width * height
  const minForSize = Math.max(1000, cellCount * 50)
  const minTime = Math.max(minForDifficulty, minForSize)

  if (durationMs < minTime) {
    return {
      valid: false,
      reason: `Completion time (${durationMs}ms) is below minimum threshold (${minTime}ms) for ${difficulty} (${width}x${height}). Possible cheating detected.`,
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
