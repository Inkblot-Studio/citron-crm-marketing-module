/** RFC-inspired practical check: local@domain with at least one dot in domain. */
export function isValidEmail(value: string): boolean {
  const s = value.trim()
  if (!s) return false
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
  return re.test(s)
}

export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Digits only, typical international length bounds. */
export function isValidPhoneDigits(value: string, minLen = 7, maxLen = 15): boolean {
  const d = normalizePhoneDigits(value)
  return d.length >= minLen && d.length <= maxLen
}

/** Person name: no digits, reasonable length, allows letters, spaces, hyphens, apostrophes. */
export function isValidPersonName(value: string): boolean {
  const t = value.trim()
  if (t.length < 2 || t.length > 120) return false
  if (/\d/.test(t)) return false
  return /^[\p{L}\s'.\-]+$/u.test(t)
}

export function stripDigitsFromName(value: string): string {
  return value.replace(/\d/g, '')
}

export function parseEmailList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function areAllValidEmails(values: string[]): boolean {
  return values.every((v) => isValidEmail(v))
}

export function isOptionalHttpUrl(value: string): boolean {
  const s = value.trim()
  if (!s) return true
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateMarketingCompose(input: {
  fromName: string
  fromEmail: string
  replyTo: string
  bcc: string
  subject: string
}): { ok: true } | { ok: false; message: string } {
  if (input.fromName.trim() && !isValidPersonName(input.fromName)) {
    return { ok: false, message: 'From name should be a real name without numbers.' }
  }
  if (!isValidEmail(input.fromEmail)) {
    return { ok: false, message: 'Enter a valid from email address.' }
  }
  if (input.replyTo.trim() && !isValidEmail(input.replyTo)) {
    return { ok: false, message: 'Reply-to must be a valid email address.' }
  }
  const bccParts = parseEmailList(input.bcc)
  if (bccParts.length && !areAllValidEmails(bccParts)) {
    return { ok: false, message: 'BCC must be one or more valid email addresses, separated by commas.' }
  }
  if (!input.subject.trim()) {
    return { ok: false, message: 'Add a subject line before sending.' }
  }
  return { ok: true }
}
