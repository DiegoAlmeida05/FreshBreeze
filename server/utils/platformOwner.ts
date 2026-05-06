export function normalizeEmail(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const withoutInvisibleChars = value
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
  const withoutQuotes = withoutInvisibleChars
    .replace(/^['"`\u201C\u201D\u2018\u2019]+/, '')
    .replace(/['"`\u201C\u201D\u2018\u2019]+$/, '')

  const normalized = withoutQuotes.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

export function getPlatformOwnerEmailsFromEnv(): Set<string> {
  const rawValue = process.env.PLATFORM_OWNER_EMAILS ?? ''

  return new Set(
    rawValue
      .split(/[\n,;]/g)
      .map((email) => normalizeEmail(email))
      .filter((email): email is string => Boolean(email)),
  )
}

export function isPlatformOwnerEmail(email: string | null | undefined): boolean {
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    return false
  }

  const ownerEmails = getPlatformOwnerEmailsFromEnv()
  return ownerEmails.has(normalizedEmail)
}
