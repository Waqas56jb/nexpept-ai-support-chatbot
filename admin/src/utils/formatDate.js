const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

const DIVISIONS = [
  { amount: 60, name: 'second' },
  { amount: 60, name: 'minute' },
  { amount: 24, name: 'hour' },
  { amount: 7, name: 'day' },
  { amount: 4.34524, name: 'week' },
  { amount: 12, name: 'month' },
  { amount: Number.POSITIVE_INFINITY, name: 'year' },
]

function getRelativeDivision(seconds) {
  let duration = seconds
  for (let i = 0; i < DIVISIONS.length; i += 1) {
    const division = DIVISIONS[i]
    if (Math.abs(duration) < division.amount) {
      return { value: Math.round(duration), unit: division.name }
    }
    duration /= division.amount
  }
  return { value: 0, unit: 'second' }
}

/**
 * @param {string | Date} input
 * @returns {string}
 */
export function relativeTime(input) {
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return '—'

  const seconds = (date.getTime() - Date.now()) / 1000
  const { value, unit } = getRelativeDivision(seconds)
  return rtf.format(value, unit)
}

/**
 * @param {string | Date} input
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDateTime(input, options) {
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return '—'

  const defaults = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }

  return new Intl.DateTimeFormat(undefined, { ...defaults, ...options }).format(date)
}
