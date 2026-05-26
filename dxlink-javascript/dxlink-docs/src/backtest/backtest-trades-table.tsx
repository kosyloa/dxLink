import { unit } from '@dxfeed/ui-kit/utils'
import { Fragment } from 'react'
import styled from 'styled-components'

import type { StrategyTrade } from './backtest-api'
import { DataTable, DataTableRow } from '../debug-console/feed-data'

const TableGroup = styled.div`
  display: flex;
  overflow: auto;
  padding-top: ${unit(1)};
`

const TradesTable = styled(DataTable)`
  border-collapse: collapse;

  td,
  th {
    border: 1px solid ${({ theme }) => theme.palette.separator.primary};
  }
`

const HeadCell = styled.th`
  display: table-cell;
  padding: ${unit(1)} ${unit(1.25)};
  white-space: nowrap;
  font-weight: 600;
  text-align: left;
  background-color: ${({ theme }) => theme.background.secondary.main};
  color: ${({ theme }) => theme.palette.secondary.main};
  ${(p) => p.theme.typography.body.regular[4]}
`

const Cell = styled.td<{ align?: 'left' | 'right'; muted?: boolean }>`
  display: table-cell;
  padding: ${unit(0.75)} ${unit(1.25)};
  white-space: nowrap;
  text-align: ${({ align }) => align ?? 'left'};
  color: ${({ theme, muted }) =>
    muted ? theme.palette.secondary.main : theme.palette.primary.main};
  ${(p) => p.theme.typography.body.regular[4]}
`

const LegCell = styled(Cell)`
  font-weight: 600;
`

const MergedCell = styled(Cell)`
  vertical-align: middle;
`

const TradeStartRow = styled(DataTableRow)`
  && td {
    border-top-width: 2px;
  }
`

function field<T extends Record<string, unknown>>(obj: T, camel: keyof T, snake: keyof T): unknown {
  return obj[camel] ?? obj[snake]
}

function formatTradeTime(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return ''
  }
  const millis = typeof value === 'string' ? Number(value) : Number(value)
  if (!Number.isFinite(millis)) {
    return String(value)
  }
  const date = new Date(millis)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(
    date.getUTCHours()
  )}:${pad(date.getUTCMinutes())}`
}

function formatTradeNumber(value: unknown, fractionDigits = 4): string {
  if (value === undefined || value === null || value === '') {
    return ''
  }
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return String(value)
  }
  return num.toFixed(fractionDigits).replace('.', ',')
}

function formatTradeSize(value: unknown): string {
  return formatTradeNumber(value, 2)
}

function formatSignedMetric(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return ''
  }
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return String(value)
  }
  const sign = num >= 0 ? '+' : ''
  return ` ${sign}${formatTradeNumber(num)}`
}

const TRADE_HEADERS = [
  '#',
  'Direction',
  'Leg',
  'Side',
  'Entry signal',
  'Exit signal',
  'Time',
  'Price',
  'Size',
  'Net PnL',
  'Cumulative PnL',
  'Max runup',
  'Max drawdown',
] as const

export interface BacktestTradesTableProps {
  trades: StrategyTrade[]
}

export function BacktestTradesTable({ trades }: BacktestTradesTableProps) {
  return (
    <TableGroup>
      <TradesTable>
        <thead>
          <DataTableRow>
            {TRADE_HEADERS.map((header) => (
              <HeadCell key={header || 'leg'}>{header}</HeadCell>
            ))}
          </DataTableRow>
        </thead>
        <tbody>
          {trades.map((trade, index) => {
            const tradeNumber = field(trade, 'tradeNumber', 'trade_number')
            const direction = field(trade, 'direction', 'direction')
            const entrySignal = field(trade, 'entrySignal', 'entry_signal')
            const exitSignal = field(trade, 'exitSignal', 'exit_signal')
            const isOpen = Boolean(field(trade, 'open', 'open'))
            const size = field(trade, 'size', 'size')
            const rowKey = tradeNumber ?? index

            const entrySignalText = entrySignal !== undefined ? String(entrySignal) : ''
            const exitEntryCol = isOpen
              ? 'open'
              : exitSignal !== undefined
              ? String(exitSignal)
              : ''
            const exitExitCol = isOpen ? '-' : exitSignal !== undefined ? String(exitSignal) : '-'

            const EntryRow = index === 0 ? DataTableRow : TradeStartRow

            return (
              <Fragment key={rowKey}>
                <EntryRow>
                  <MergedCell rowSpan={2} align="right">
                    {formatTradeNumber(tradeNumber, 0)}
                  </MergedCell>
                  <MergedCell rowSpan={2}>
                    {direction !== undefined ? String(direction) : ''}
                  </MergedCell>
                  <LegCell>Entry</LegCell>
                  <Cell>{String(field(trade, 'entrySide', 'entry_side') ?? '')}</Cell>
                  <Cell>{entrySignalText}</Cell>
                  <Cell>{entrySignalText}</Cell>
                  <Cell>
                    {formatTradeTime(field(trade, 'entryTimeMillis', 'entry_time_millis'))}
                  </Cell>
                  <Cell align="right">
                    {formatTradeNumber(field(trade, 'entryPrice', 'entry_price'))}
                  </Cell>
                  <MergedCell rowSpan={2} align="right">
                    {formatTradeSize(size)}
                  </MergedCell>
                  <MergedCell rowSpan={2} align="right">
                    {formatSignedMetric(field(trade, 'netPnl', 'net_pnl'))}
                  </MergedCell>
                  <MergedCell rowSpan={2} align="right">
                    {formatSignedMetric(field(trade, 'cumulativePnl', 'cumulative_pnl'))}
                  </MergedCell>
                  <MergedCell rowSpan={2} align="right">
                    {formatSignedMetric(field(trade, 'maxRunup', 'max_runup'))}
                  </MergedCell>
                  <MergedCell rowSpan={2} align="right">
                    {formatSignedMetric(field(trade, 'maxDrawdown', 'max_drawdown'))}
                  </MergedCell>
                </EntryRow>
                <DataTableRow>
                  <LegCell>Exit</LegCell>
                  <Cell>
                    {isOpen
                      ? ''
                      : String(field(trade, 'exitSide', 'exit_side') ?? '')}
                  </Cell>
                  <Cell>{exitEntryCol}</Cell>
                  <Cell>{exitExitCol}</Cell>
                  <Cell>{formatTradeTime(field(trade, 'exitTimeMillis', 'exit_time_millis'))}</Cell>
                  <Cell align="right">
                    {formatTradeNumber(field(trade, 'exitPrice', 'exit_price'))}
                  </Cell>
                </DataTableRow>
              </Fragment>
            )
          })}
        </tbody>
      </TradesTable>
    </TableGroup>
  )
}
