const getBacktestBaseUrl = (location: Location) => {
  const debugIndex = location.pathname.indexOf('/debug')
  const pathname = debugIndex !== -1 ? location.pathname.slice(0, debugIndex) : location.pathname
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`

  return `${location.protocol}//${location.host}${path}`
}

export const DEFAULT_BACKTEST_URL =
  typeof window !== 'undefined' ? getBacktestBaseUrl(window.location) : 'http://localhost:8080/'

export { DEFAULT_BACKTEST_SCRIPT } from './backtest-samples'

export const DEFAULT_BACKTEST_SYMBOL = 'AAPL{=d}'

function formatDatetimeLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

export function createDefaultFromTimeLocal(): string {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 2)
  return formatDatetimeLocal(date)
}

export function createDefaultToTimeLocal(): string {
  return formatDatetimeLocal(new Date())
}

export function datetimeLocalToIsoUtc(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw Object.assign(new Error('Invalid date/time'), {
      details: `Validation failed before the request was sent.\n\nInvalid date/time value: "${value}"`,
    })
  }
  return date.toISOString()
}
