import { unit } from '@dxfeed/ui-kit/utils'
import { useState } from 'react'
import styled from 'styled-components'

import { normalizeBacktestResponse, runBacktest } from './backtest-api'
import type {
  BacktestCalculationResult,
  BacktestCandle,
  StrategyAnalytics,
  StrategyFillReport,
  StrategyTradeReport,
} from './backtest-api'
import { BacktestChart } from './backtest-chart'
import { unknownToBacktestError } from './backtest-error'
import type { BacktestFormSubmit } from './backtest-form'
import { BacktestForm } from './backtest-form'
import { BacktestResults } from './backtest-results'

const Root = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
`

const ChartSection = styled.div`
  padding-top: ${unit(2)};
`

export function BacktestPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ summary: string; details: string } | undefined>()
  const [candles, setCandles] = useState<BacktestCandle[]>([])
  const [calculationResult, setCalculationResult] = useState<
    BacktestCalculationResult | undefined
  >()
  const [strategyTradeReport, setStrategyTradeReport] = useState<StrategyTradeReport | undefined>()
  const [strategyFillReport, setStrategyFillReport] = useState<StrategyFillReport | undefined>()
  const [strategyAnalytics, setStrategyAnalytics] = useState<StrategyAnalytics | undefined>()

  const handleCalculate = async ({ baseUrl, params, content }: BacktestFormSubmit) => {
    setLoading(true)
    setError(undefined)

    try {
      const response = await runBacktest(baseUrl, params, content)
      const normalized = normalizeBacktestResponse(response)

      setCandles(normalized.candles)
      setCalculationResult(normalized.calculationResult)
      setStrategyTradeReport(normalized.strategyTradeReport)
      setStrategyFillReport(normalized.strategyFillReport)
      setStrategyAnalytics(normalized.strategyAnalytics)
    } catch (e) {
      setCandles([])
      setCalculationResult(undefined)
      setStrategyTradeReport(undefined)
      setStrategyFillReport(undefined)
      setStrategyAnalytics(undefined)
      const backtestError = unknownToBacktestError(e)
      setError({ summary: backtestError.message, details: backtestError.details })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Root>
      <BacktestForm loading={loading} error={error} onCalculate={handleCalculate} />

      {candles.length > 0 && (
        <ChartSection>
          <BacktestChart candles={candles} calculationResult={calculationResult} />
        </ChartSection>
      )}

      <BacktestResults
        strategyTradeReport={strategyTradeReport}
        strategyFillReport={strategyFillReport}
        strategyAnalytics={strategyAnalytics}
      />
    </Root>
  )
}
