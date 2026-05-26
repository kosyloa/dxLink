import { createChart, Chart } from '@devexperts/dxcharts-lite'
import {
  type DXLinkIndiChartCandle,
  type DXLinkIndiChartIndicator,
  type DXLinkIndiChartIndicatorParameterMeta,
  type DXLinkIndiChartIndicatorsData,
  type DXLinkIndiChartIndicatorsParameters,
  type DXLinkIndiChartSubscription,
} from '@dxfeed/dxlink-api'
import { unit } from '@dxfeed/ui-kit/utils'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { candleChartColors } from './candles-chart'
import { ParameterFieldContainer } from './parameter-field-container'
import { ScriptCandlesSubscription } from './script-candles-subscription'
import {
  mergeIndicatorUpdates,
  processIndicators,
  renderIndicatorSeries,
  type SeriesMetadata,
} from '../chart/chart-indicator-utils'
import type { ChartDataType, ChartHolder } from '../chart-wrapper'
import { ContentTemplate } from '../common/content-template'

const ChartContainer = styled.div`
  width: 100%;
  height: 600px;
  border: 1px solid ${({ theme }) => theme.palette.separator.primary};
`

const Group = styled.div`
  padding-bottom: ${unit(1.5)};
`

const ChartGroup = styled.div<{ available: boolean }>`
  display: ${(props) => (props.available ? 'block' : 'none')};
`

const Powered = styled.div`
  text-align: right;
  padding-top: ${unit(1)};
  color: ${({ theme }) => theme.palette.secondary.main};
  ${(p) => p.theme.typography.body.regular[3]}
`

interface ScriptCandlesChannelManagerProps {
  channel: ChartHolder
}

export function ScriptCandlesChannelManager({ channel }: ScriptCandlesChannelManagerProps) {
  const [available, setAvailable] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [inParameters, setInParameters] = useState<DXLinkIndiChartIndicatorParameterMeta[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Chart>()
  const seriesMetadataRef = useRef<Record<string, SeriesMetadata>>({})
  const candlesRef = useRef<{ timestamp: number; idx: number; close: number }[]>([])

  const handleDataUpdate = (
    events: DXLinkIndiChartCandle[],
    indicators: DXLinkIndiChartIndicatorsData[],
    dataType: ChartDataType,
    chart: Chart
  ) => {
    const candles = events.map((event) => ({
      hi: Number(event.high),
      lo: Number(event.low),
      open: Number(event.open),
      close: Number(event.close),
      timestamp: event.time,
      volume: Number(event.volume),
      idx: event.index,
    }))

    if (dataType === 'candles') {
      seriesMetadataRef.current = {}
      candlesRef.current = candles

      const symbol = events[0]?.eventSymbol ?? 'N/A'

      chart.watermarkComponent.setWaterMarkData({
        firstRow: symbol,
      })

      chart.setData({
        candles,
        instrument: {
          symbol,
        },
      })

      Object.keys(chart.paneManager.panes).forEach((pane) => {
        if (pane !== 'CHART') {
          chart.paneManager.removePane(pane)
        }
      })

      setAvailable(true)
      return
    }

    if (dataType === 'indicators') {
      const storedCandles = candlesRef.current
      if (storedCandles.length === 0) {
        console.error('No candles available for indicator processing')
        return
      }

      const results = processIndicators(
        indicators as Record<string, unknown>[],
        storedCandles,
        seriesMetadataRef
      )
      renderIndicatorSeries(chart, results, seriesMetadataRef)
      return
    }

    const results = processIndicators(
      indicators as Record<string, unknown>[],
      candles,
      seriesMetadataRef
    )

    chart.updateData({
      candles,
    })

    mergeIndicatorUpdates(chart, results)
  }

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
  }, [channel])

  const handleSet = (sub: DXLinkIndiChartSubscription, indicator: DXLinkIndiChartIndicator) => {
    setError(undefined)

    channel.update(
      sub,
      indicator,
      (candles, indicators, dataType) => {
        handleDataUpdate(candles, indicators, dataType, chartRef.current!)
      },
      (params) => setInParameters(params),
      setError
    )
  }

  const handleOnApply = (values: DXLinkIndiChartIndicatorsParameters[string]) => {
    channel.getChart()?.updateIndicatorsParameters({ current: values })
  }

  const handleReset = () => {
    channel.clear()
    setInParameters([])
    setAvailable(false)
  }
  return (
    <>
      <Group>
        <ScriptCandlesSubscription onSet={handleSet} onReset={handleReset} error={error} />{' '}
      </Group>

      {inParameters.length > 0 && available && (
        <ContentTemplate title={'Input Parameters'}>
          <ParameterFieldContainer parameters={inParameters} onApply={handleOnApply} />
        </ContentTemplate>
      )}

      {inParameters.length > 0 && <div style={{ height: '16px' }} />}

      <ChartGroup available={available}>
        <ContentTemplate title={'Chart'}>
          <ChartContainer ref={ref} />
          <Powered>
            Chart powered by{' '}
            <a href="https://devexperts.com/dxcharts/" target="_blank" rel="noreferrer">
              DXCharts
            </a>
          </Powered>
        </ContentTemplate>
      </ChartGroup>
    </>
  )
}
