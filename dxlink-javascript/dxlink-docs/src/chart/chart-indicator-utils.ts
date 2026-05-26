import type { Chart } from '@devexperts/dxcharts-lite'
import type { MutableRefObject } from 'react'

import { SortedList } from '../candles/sorted-list'

export interface ChartCandlePoint {
  timestamp: number
  idx: number
  close: number
}

export interface SeriesMetadata {
  title: string
  color?: string
  offset: number
}

export const stringToColour = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  let colour = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    colour += ('00' + value.toString(16)).substr(-2)
  }
  return colour
}

export const extractValue = (val: unknown): number => {
  if (val && typeof val === 'object' && 'value' in val) {
    return Number((val as { value: unknown }).value)
  }
  return Number(val)
}

export const extractMetadata = (
  values: unknown[],
  key: string,
  cache: Record<string, SeriesMetadata>
): SeriesMetadata => {
  const first = values[0]
  if (first && typeof first === 'object') {
    const obj = first as { title?: string; color?: { value?: string } | string; offset?: number }
    if (obj.title) {
      let colorValue: string | undefined
      if (obj.color) {
        if (typeof obj.color === 'object' && 'value' in obj.color) {
          colorValue = obj.color.value?.toLowerCase()
        } else if (typeof obj.color === 'string') {
          colorValue = obj.color.toLowerCase()
        }
      }
      cache[key] = {
        title: obj.title,
        color: colorValue,
        offset: obj.offset || 0,
      }
    }
  }
  return cache[key] || { title: key, offset: 0 }
}

export const processIndicators = (
  indicators: Record<string, unknown>[],
  candles: ChartCandlePoint[],
  seriesMetadataRef: MutableRefObject<Record<string, SeriesMetadata>>
): Record<string, ChartCandlePoint[]> => {
  const results: Record<string, ChartCandlePoint[]> = {}

  for (const data of indicators) {
    for (const outputTypes of Object.values(data)) {
      if (typeof outputTypes !== 'object' || outputTypes === null) continue

      for (const seriesData of Object.values(outputTypes)) {
        if (typeof seriesData !== 'object' || seriesData === null) continue

        Object.keys(seriesData).forEach((key) => {
          const values = (seriesData as Record<string, unknown[]>)[key]
          if (!Array.isArray(values) || values.length === 0) return

          const metadata = extractMetadata(values, key, seriesMetadataRef.current)
          const seriesTitle = metadata.title
          const seriesOffset = metadata.offset

          const base = results[seriesTitle] ?? []
          const offset = base.length

          results[seriesTitle] = values.reduce<ChartCandlePoint[]>((acc, value, index) => {
            const candleIndex = offset + index + seriesOffset
            const candle = candles[candleIndex]
            if (candle === undefined) {
              console.error('Illegal state, candle not found at index', candleIndex)
              return acc
            }

            acc.push({
              timestamp: candle.timestamp,
              idx: candle.idx,
              close: extractValue(value),
            })

            return acc
          }, base)
        })
      }
    }
  }

  return results
}

export const renderIndicatorSeries = (
  chart: Chart,
  results: Record<string, ChartCandlePoint[]>,
  seriesMetadataRef: MutableRefObject<Record<string, SeriesMetadata>>
) => {
  const resultKeys = Object.keys(results)

  for (const key of resultKeys) {
    let pane = chart.paneManager.panes[key]
    if (pane === undefined) {
      pane = chart.paneManager.createPane(key, {
        cursor: key,
      })
      pane.yAxis.changeLabelsDescriptionVisibility(true)
    }

    let series = pane.dataSeries[0]
    if (series === undefined) {
      series = pane.createDataSeries()
      series.name = key

      const seriesInfo = Object.values(seriesMetadataRef.current).find((meta) => meta.title === key)

      const paintConfig = series.config.paintConfig[0]
      if (paintConfig !== undefined) {
        paintConfig.color = seriesInfo?.color || stringToColour(key)
      }
      series.config.visible = true
      series.config.labelLastValue = 'series'
      series.config.labelMode = 'line-label'
      series.config.labelAppearanceType = 'badge'
      pane.yAxis.registerYAxisLabelsProvider(series.yAxisLabelProvider)
    } else {
      const seriesInfo = Object.values(seriesMetadataRef.current).find((meta) => meta.title === key)
      const paintConfig = series.config.paintConfig[0]
      if (paintConfig !== undefined && seriesInfo?.color) {
        paintConfig.color = seriesInfo.color
      }
    }

    series.setDataPoints(results[key]!)
  }

  Object.keys(chart.paneManager.panes).forEach((pane) => {
    if (!resultKeys.includes(pane) && pane !== 'CHART') {
      chart.paneManager.removePane(pane)
    }
  })
}

export const mergeIndicatorUpdates = (
  chart: Chart,
  results: Record<string, ChartCandlePoint[]>
) => {
  const resultKeys = Object.keys(results)

  for (const key of resultKeys) {
    try {
      const pane = chart.paneManager.panes[key]
      if (pane === undefined) return

      const points = pane.dataSeries[0]?.dataPoints ?? []
      const sortedPoints = SortedList.from(points, (a, b) => a.timestamp - b.timestamp)

      for (const point of results[key]!) {
        sortedPoints.insert(point)
      }

      const newPoints = Array.from(sortedPoints.toArray())

      pane.dataSeries[0]?.setDataPoints(newPoints)
      pane.yAxis.model.fancyLabelsModel.updateLabels()
    } catch (e) {
      console.error(e)
    }
  }
}
