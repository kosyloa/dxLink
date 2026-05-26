import { createChart, type Chart } from '@devexperts/dxcharts-lite'
import { unit } from '@dxfeed/ui-kit/utils'
import { useEffect, useRef } from 'react'
import styled from 'styled-components'

import type { BacktestCandle, BacktestCalculationResult } from './backtest-api'
import { calculationResultToIndicators } from './backtest-api'
import {
  type ChartCandlePoint,
  processIndicators,
  renderIndicatorSeries,
  type SeriesMetadata,
} from '../chart/chart-indicator-utils'
import { ContentTemplate } from '../common/content-template'
import { candleChartColors } from '../debug-console/candles-chart'

const ChartContainer = styled.div`
  width: 100%;
  height: 600px;
  border: 1px solid ${({ theme }) => theme.palette.separator.primary};
`

const Powered = styled.div`
  text-align: right;
  padding-top: ${unit(1)};
  color: ${({ theme }) => theme.palette.secondary.main};
  ${(p) => p.theme.typography.body.regular[3]}
`

export interface BacktestChartProps {
  candles: BacktestCandle[]
  calculationResult?: BacktestCalculationResult
}

function toNumber(value: number | string | undefined, fallback = 0): number {
  if (value === undefined) {
    return fallback
  }
  const parsed = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(parsed) ? parsed : fallback
}

function mapCandles(candles: BacktestCandle[]) {
  const chartCandles = candles.map((event, arrayIndex) => {
    const time = toNumber(event.time)
    const index = toNumber(event.index, arrayIndex)

    return {
      hi: toNumber(event.high),
      lo: toNumber(event.low),
      open: toNumber(event.open),
      close: toNumber(event.close),
      timestamp: time,
      volume: toNumber(event.volume),
      idx: index,
    }
  })

  const indicatorCandles: ChartCandlePoint[] = chartCandles.map((candle) => ({
    timestamp: candle.timestamp,
    idx: candle.idx,
    close: candle.close,
  }))

  return { chartCandles, indicatorCandles }
}

function renderChart(
  chart: Chart,
  candles: BacktestCandle[],
  calculationResult: BacktestCalculationResult | undefined,
  seriesMetadataRef: React.MutableRefObject<Record<string, SeriesMetadata>>
) {
  const { chartCandles, indicatorCandles } = mapCandles(candles)

  if (chartCandles.length === 0) {
    return
  }

  const symbol = candles[0]?.eventSymbol ?? candles[0]?.event_symbol ?? 'N/A'

  seriesMetadataRef.current = {}

  chart.watermarkComponent.setWaterMarkData({
    firstRow: symbol,
  })

  chart.setData({
    candles: chartCandles,
    instrument: {
      symbol,
    },
  })

  Object.keys(chart.paneManager.panes).forEach((pane) => {
    if (pane !== 'CHART') {
      chart.paneManager.removePane(pane)
    }
  })

  if (calculationResult) {
    const indicators = calculationResultToIndicators(calculationResult)
    const results = processIndicators(indicators, indicatorCandles, seriesMetadataRef)
    renderIndicatorSeries(chart, results, seriesMetadataRef)
  }
}

export function BacktestChart({ candles, calculationResult }: BacktestChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Chart>()
  const seriesMetadataRef = useRef<Record<string, SeriesMetadata>>({})

  useEffect(() => {
    const chart = createChart(ref.current!, {
      colors: candleChartColors,
      components: {
        waterMark: {
          visible: true,
        },
      },
    })

    chartRef.current = chart

    return () => {
      chart.destroy()
    }
  }, [])

  useEffect(() => {
    if (chartRef.current && candles.length > 0) {
      renderChart(chartRef.current, candles, calculationResult, seriesMetadataRef)
    }
  }, [candles, calculationResult])

  if (candles.length === 0) {
    return null
  }

  return (
    <ContentTemplate title="Chart">
      <ChartContainer ref={ref} />
      <Powered>
        Chart powered by{' '}
        <a href="https://devexperts.com/dxcharts/" target="_blank" rel="noreferrer">
          DXCharts
        </a>
      </Powered>
    </ContentTemplate>
  )
}
