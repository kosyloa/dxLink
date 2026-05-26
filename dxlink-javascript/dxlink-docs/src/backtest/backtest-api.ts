import {
  BacktestRequestError,
  formatHttpError,
  formatScriptError,
  toBacktestRequestError,
} from './backtest-error'

const BACKTEST_PATH = '/dxscript.backtesting.v1.backtestingservice/backtest'
const BACKTEST_LANG = 'dxscript-js'

export interface BacktestParams {
  symbol: string
  from_time?: string
  to_time?: string
  fromTime?: string
  toTime?: string
}

export interface BacktestRequestBody {
  lang: string
  content: string
  symbol: string
  from_time: string
  to_time: string
}

export interface ProtoListValue {
  values?: unknown[]
}

export interface ProtoSplineKnot {
  value?: number | null
  color?: { value?: string; alpha?: number }
  title?: string
  offset?: number
}

export interface ProtoSplineLayer {
  knots?: ProtoSplineKnot[]
}

export interface BacktestCalculationResult {
  output?: Record<string, ProtoListValue | unknown[]>
  spline?: Record<string, ProtoSplineLayer>
  backgroundColor?: Record<string, { values?: unknown[] }>
  barColor?: Record<string, { values?: unknown[] }>
  shape?: Record<string, { points?: unknown[] }>
}

export interface BacktestCandle {
  eventSymbol?: string
  event_symbol?: string
  index?: number | string
  time?: number | string
  open?: number
  high?: number
  low?: number
  close?: number
  volume?: number
}

export interface StrategyTrade {
  tradeNumber?: number
  trade_number?: number
  direction?: string
  entrySignal?: string
  entry_signal?: string
  exitSignal?: string
  exit_signal?: string
  entryBarIndex?: number
  entry_bar_index?: number
  entryTimeMillis?: number | string
  entry_time_millis?: number | string
  entryPrice?: number
  entry_price?: number
  exitBarIndex?: number
  exit_bar_index?: number
  exitTimeMillis?: number | string
  exit_time_millis?: number | string
  exitPrice?: number
  exit_price?: number
  size?: number
  netPnl?: number
  net_pnl?: number
  cumulativePnl?: number
  cumulative_pnl?: number
  maxRunup?: number
  max_runup?: number
  maxDrawdown?: number
  max_drawdown?: number
  open?: boolean
  entrySide?: string
  entry_side?: string
  exitSide?: string
  exit_side?: string
}

export interface StrategyPerformanceSummary {
  initialCapital?: number
  initial_capital?: number
  finalEquity?: number
  final_equity?: number
  netProfit?: number
  net_profit?: number
  realizedNetProfit?: number
  realized_net_profit?: number
  grossProfit?: number
  gross_profit?: number
  grossLoss?: number
  gross_loss?: number
  profitFactor?: number | null
  profit_factor?: number | null
  commissionPaid?: number
  commission_paid?: number
  expectedPayoff?: number
  expected_payoff?: number
  totalClosedTrades?: number
  total_closed_trades?: number
  winningTrades?: number
  winning_trades?: number
  losingTrades?: number
  losing_trades?: number
  evenTrades?: number
  even_trades?: number
  percentProfitable?: number
  percent_profitable?: number
  avgPnl?: number
  avg_pnl?: number
  avgWinningTrade?: number
  avg_winning_trade?: number
  avgLosingTrade?: number
  avg_losing_trade?: number
  largestWinningTrade?: number
  largest_winning_trade?: number
  largestLosingTrade?: number
  largest_losing_trade?: number
  maxEquityDrawdown?: number
  max_equity_drawdown?: number
  maxEquityDrawdownPercent?: number
  max_equity_drawdown_percent?: number
  sharpeRatio?: number | null
  sharpe_ratio?: number | null
  sortinoRatio?: number | null
  sortino_ratio?: number | null
  buyHoldReturnPercent?: number
  buy_hold_return_percent?: number
  strategyReturnPercent?: number
  strategy_return_percent?: number
  strategyOutperformancePercent?: number
  strategy_outperformance_percent?: number
}

export interface StrategyTradeReport {
  trades?: StrategyTrade[]
}

export interface StrategyFill {
  fillNumber?: number
  fill_number?: number
  direction?: string
  legType?: string
  leg_type?: string
  signal?: string
  side?: string
  barIndex?: number
  bar_index?: number
  timeMillis?: number | string
  time_millis?: number | string
  price?: number
  size?: number
}

export interface StrategyFillReport {
  fills?: StrategyFill[]
}

export interface StrategyAnalytics {
  equitySeries?: number[]
  equity_series?: number[]
  barCloseSeries?: number[]
  bar_close_series?: number[]
  totalCommissionPaid?: number
  total_commission_paid?: number
  performance?: StrategyPerformanceSummary
}

export interface ScriptStackFrame {
  functionName?: string
  function_name?: string
  line?: number
  column?: number
}

export interface ScriptError {
  id?: string
  message?: string
  type?: string
  scriptName?: string
  script_name?: string
  startLine?: number
  start_line?: number
  startColumn?: number
  start_column?: number
  endLine?: number
  end_line?: number
  endColumn?: number
  end_column?: number
  scriptStack?: ScriptStackFrame[]
  script_stack?: ScriptStackFrame[]
}

export interface BacktestResponse {
  candles?: BacktestCandle[]
  calculationResult?: BacktestCalculationResult
  calculation_result?: BacktestCalculationResult
  strategyTradeReport?: StrategyTradeReport
  strategy_trade_report?: StrategyTradeReport
  strategyAnalytics?: StrategyAnalytics
  strategy_analytics?: StrategyAnalytics
  strategyFillReport?: StrategyFillReport
  strategy_fill_report?: StrategyFillReport
  error?: ScriptError
}

function isLocalBacktestServer(baseUrl: string): boolean {
  if (!baseUrl) {
    return true
  }

  try {
    const url = new URL(baseUrl.includes('://') ? baseUrl : `http://${baseUrl}`)
    const host = url.hostname
    const port = url.port || (url.protocol === 'https:' ? '443' : '80')
    return (host === 'localhost' || host === '127.0.0.1') && port === '8080'
  } catch {
    return false
  }
}

function isSameOriginBacktestBase(baseUrl: string): boolean {
  if (typeof window === 'undefined' || !baseUrl) {
    return false
  }

  try {
    const url = new URL(baseUrl.includes('://') ? baseUrl : `http://${baseUrl}`)
    return url.origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * Same-origin and dev localhost:8080 requests use a relative path (Vite proxy in dev).
 */
export function buildBacktestUrl(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/+$/, '')

  if (
    isSameOriginBacktestBase(normalized) ||
    (import.meta.env.DEV && isLocalBacktestServer(normalized))
  ) {
    return BACKTEST_PATH
  }

  return `${normalized}${BACKTEST_PATH}`
}

export function buildBacktestRequest(params: BacktestParams, content: string): BacktestRequestBody {
  const fromTime = params.fromTime ?? params.from_time
  const toTime = params.toTime ?? params.to_time

  if (!params.symbol?.trim()) {
    throw new Error('symbol is required')
  }
  if (!fromTime?.trim()) {
    throw new Error('from_time is required')
  }
  if (!toTime?.trim()) {
    throw new Error('to_time is required')
  }
  if (!content.trim()) {
    throw new Error('strategy content is required')
  }

  return {
    lang: BACKTEST_LANG,
    content,
    symbol: params.symbol.trim(),
    from_time: fromTime.trim(),
    to_time: toTime.trim(),
  }
}

async function readResponsePayload(response: Response): Promise<{ raw: string; json: unknown }> {
  const raw = await response.text()
  if (!raw) {
    return { raw: '', json: null }
  }
  try {
    return { raw, json: JSON.parse(raw) as unknown }
  } catch {
    return { raw, json: null }
  }
}

export async function runBacktest(
  baseUrl: string,
  params: BacktestParams,
  content: string
): Promise<BacktestResponse> {
  const url = buildBacktestUrl(baseUrl)
  const body = buildBacktestRequest(params, content)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    throw toBacktestRequestError(
      `Network error: ${message}`,
      [`Network error: ${message}`, `URL: ${url}`, '', String(e)].join('\n')
    )
  }

  const { raw, json } = await readResponsePayload(response)

  if (!response.ok) {
    const details = formatHttpError(response.status, response.statusText, url, raw, json)
    const summary =
      typeof json === 'object' && json !== null && !Array.isArray(json)
        ? String(
            (json as Record<string, unknown>).message ??
              (json as Record<string, unknown>).reason ??
              (json as { error?: ScriptError }).error?.message ??
              `HTTP ${response.status}`
          )
        : raw.trim() || `HTTP ${response.status}`
    throw toBacktestRequestError(summary, details)
  }

  const data = (json ?? {}) as BacktestResponse & { message?: string }

  if (data.error) {
    const details = formatScriptError(data.error)
    const summary = data.error.message ?? 'Script execution failed'
    throw toBacktestRequestError(summary, details)
  }

  if (!json) {
    throw new BacktestRequestError(
      'Invalid response',
      ['Invalid response: expected JSON', `URL: ${url}`, '', raw || '(empty body)'].join('\n')
    )
  }

  return data
}

export function normalizeBacktestResponse(response: BacktestResponse): {
  candles: BacktestCandle[]
  calculationResult?: BacktestCalculationResult
  strategyTradeReport?: StrategyTradeReport
  strategyFillReport?: StrategyFillReport
  strategyAnalytics?: StrategyAnalytics
} {
  return {
    candles: response.candles ?? [],
    calculationResult: response.calculationResult ?? response.calculation_result,
    strategyTradeReport: response.strategyTradeReport ?? response.strategy_trade_report,
    strategyFillReport: response.strategyFillReport ?? response.strategy_fill_report,
    strategyAnalytics: response.strategyAnalytics ?? response.strategy_analytics,
  }
}

export function calculationResultToIndicators(
  calculationResult: BacktestCalculationResult
): Record<string, unknown>[] {
  const output: Record<string, unknown[]> = {}

  if (calculationResult.output) {
    for (const [key, listValue] of Object.entries(calculationResult.output)) {
      if (Array.isArray(listValue)) {
        output[key] = listValue
      } else if (listValue && typeof listValue === 'object' && 'values' in listValue) {
        output[key] = (listValue as ProtoListValue).values ?? []
      }
    }
  }

  const spline: Record<string, unknown[]> = {}
  if (calculationResult.spline) {
    for (const [key, layer] of Object.entries(calculationResult.spline)) {
      spline[key] = layer.knots ?? []
    }
  }

  const backgroundColor: Record<string, unknown[]> = {}
  const bg = calculationResult.backgroundColor
  if (bg) {
    for (const [key, layer] of Object.entries(bg)) {
      backgroundColor[key] = layer.values ?? []
    }
  }

  const barColor: Record<string, unknown[]> = {}
  const bc = calculationResult.barColor
  if (bc) {
    for (const [key, layer] of Object.entries(bc)) {
      barColor[key] = layer.values ?? []
    }
  }

  const shape: Record<string, unknown[]> = {}
  if (calculationResult.shape) {
    for (const [key, layer] of Object.entries(calculationResult.shape)) {
      shape[key] = layer.points ?? []
    }
  }

  return [
    {
      backtest: {
        output,
        spline,
        background_color: backgroundColor,
        bar_color: barColor,
        shape,
      },
    },
  ]
}
