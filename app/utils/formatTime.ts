/** Formats a DB time string to 12-hour format (e.g. "08:15:00" -> "8:15 AM"). */
export function fmtTime(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  const match = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/)
  if (!match) {
    return null
  }

  const hours24 = Number(match[1])
  const minutes = match[2]
  const suffix = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12

  return `${hours12}:${minutes} ${suffix}`
}
