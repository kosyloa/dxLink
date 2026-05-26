import type { ScriptError } from './backtest-api'

export class BacktestRequestError extends Error {
  readonly details: string

  constructor(summary: string, details: string) {
    super(summary)
    this.name = 'BacktestRequestError'
    this.details = details
  }
}

function field<T extends Record<string, unknown>>(obj: T, camel: keyof T, snake: keyof T): unknown {
  return obj[camel] ?? obj[snake]
}

function appendLine(lines: string[], label: string, value: unknown) {
  if (value === undefined || value === null || value === '') {
    return
  }
  lines.push(`${label}: ${String(value)}`)
}

export function formatScriptError(error: ScriptError): string {
  const lines: string[] = ['Script error']

  const type = field(error, 'type', 'type')
  const scriptName = field(error, 'scriptName', 'script_name')
  const message = field(error, 'message', 'message')
  const id = field(error, 'id', 'id')

  if (type) {
    lines[0] = `Script error (${type})`
  }

  appendLine(lines, 'ID', id)
  appendLine(lines, 'Script', scriptName)
  appendLine(lines, 'Message', message)

  const startLine = field(error, 'startLine', 'start_line')
  const startColumn = field(error, 'startColumn', 'start_column')
  const endLine = field(error, 'endLine', 'end_line')
  const endColumn = field(error, 'endColumn', 'end_column')

  if (startLine !== undefined && Number(startLine) >= 0) {
    const location =
      endLine !== undefined && Number(endLine) >= 0
        ? `line ${startLine}:${startColumn ?? 0} – ${endLine}:${endColumn ?? 0}`
        : `line ${startLine}:${startColumn ?? 0}`
    lines.push(`Location: ${location}`)
  }

  const stack = (field(error, 'scriptStack', 'script_stack') ?? []) as Record<string, unknown>[]
  if (Array.isArray(stack) && stack.length > 0) {
    lines.push('', 'Stack:')
    for (const frame of stack) {
      const fn = field(frame, 'functionName', 'function_name') ?? '<anonymous>'
      const line = field(frame, 'line', 'line')
      const column = field(frame, 'column', 'column')
      lines.push(`  at ${fn} (${line}:${column})`)
    }
  }

  return lines.join('\n')
}

function formatJsonValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function formatHttpError(
  status: number,
  statusText: string,
  url: string,
  rawBody: string,
  jsonBody: unknown
): string {
  const lines: string[] = [`HTTP ${status}${statusText ? ` ${statusText}` : ''}`, `URL: ${url}`, '']

  if (jsonBody && typeof jsonBody === 'object' && !Array.isArray(jsonBody)) {
    const body = jsonBody as Record<string, unknown>
    const scriptError = (body.error ?? body.script_error) as ScriptError | undefined
    if (scriptError && typeof scriptError === 'object') {
      lines.push(formatScriptError(scriptError))
      return lines.join('\n')
    }

    const message = body.message ?? body.reason ?? body.detail ?? body.title
    if (typeof message === 'string') {
      lines.push('Message:', message, '')
    }

    lines.push('Response body:', formatJsonValue(jsonBody))
    return lines.join('\n')
  }

  if (rawBody) {
    lines.push('Response body:', rawBody)
  } else {
    lines.push('(empty response body)')
  }

  return lines.join('\n')
}

export function toBacktestRequestError(summary: string, details: string): BacktestRequestError {
  return new BacktestRequestError(summary, details)
}

export function unknownToBacktestError(error: unknown): BacktestRequestError {
  if (error instanceof BacktestRequestError) {
    return error
  }
  if (error instanceof Error) {
    return new BacktestRequestError(error.message, error.stack ?? error.message)
  }
  const text = String(error)
  return new BacktestRequestError(text, text)
}
