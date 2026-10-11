const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function emailOk(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  return trimmed.length > 0 && EMAIL_RE.test(trimmed)
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function required(value) {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}
