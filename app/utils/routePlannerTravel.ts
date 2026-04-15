export function alignMinutesUpToFive(rawMinutes: number): number {
  if (!Number.isFinite(rawMinutes) || rawMinutes <= 0) {
    return 0
  }

  return Math.ceil(rawMinutes / 5) * 5
}

export function minutesFromDurationSeconds(rawSeconds: number): number {
  if (!Number.isFinite(rawSeconds) || rawSeconds <= 0) {
    return 0
  }

  return Math.max(0, Math.round(rawSeconds / 60))
}

export function applyTravelMinutesRule(rawMinutes: number): number {
  const normalizedMinutes = Math.max(0, Math.round(rawMinutes))

  if (normalizedMinutes < 10) {
    return 0
  }

  return alignMinutesUpToFive(normalizedMinutes)
}