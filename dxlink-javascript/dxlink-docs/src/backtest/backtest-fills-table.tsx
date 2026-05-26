import { unit } from '@dxfeed/ui-kit/utils'
import styled from 'styled-components'

import type { StrategyFill } from './backtest-api'
import { DataTable, DataTableRow } from '../debug-console/feed-data'

const TableGroup = styled.div`
  display: flex;
  overflow: auto;
  padding-top: ${unit(1)};
`

const FillsTable = styled(DataTable)`
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

const Cell = styled.td<{ align?: 'left' | 'right' }>`
  display: table-cell;
  padding: ${unit(0.75)} ${unit(1.25)};
  white-space: nowrap;
  text-align: ${({ align }) => align ?? 'left'};
  color: ${({ theme }) => theme.palette.primary.main};
  ${(p) => p.theme.typography.body.regular[4]}
`

function field<T extends Record<string, unknown>>(obj: T, camel: keyof T, snake: keyof T): unknown {
  return obj[camel] ?? obj[snake]
}

function formatFillTime(value: unknown): string {
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

function formatFillNumber(value: unknown, fractionDigits = 4): string {
  if (value === undefined || value === null || value === '') {
    return ''
  }
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return String(value)
  }
  return num.toFixed(fractionDigits).replace('.', ',')
}

function formatFillSize(value: unknown): string {
  return formatFillNumber(value, 2)
}

const FILL_HEADERS = [
  '#',
  'Direction',
  'Leg',
  'Signal',
  'Side',
  'Bar',
  'Time',
  'Price',
  'Size',
] as const

export interface BacktestFillsTableProps {
  fills: StrategyFill[]
}

export function BacktestFillsTable({ fills }: BacktestFillsTableProps) {
  return (
    <TableGroup>
      <FillsTable>
        <thead>
          <DataTableRow>
            {FILL_HEADERS.map((header) => (
              <HeadCell key={header}>{header}</HeadCell>
            ))}
          </DataTableRow>
        </thead>
        <tbody>
          {fills.map((fill, index) => {
            const fillNumber = field(fill, 'fillNumber', 'fill_number')
            const rowKey = fillNumber ?? index

            return (
              <DataTableRow key={rowKey}>
                <Cell align="right">{formatFillNumber(fillNumber, 0)}</Cell>
                <Cell>{String(field(fill, 'direction', 'direction') ?? '')}</Cell>
                <Cell>{String(field(fill, 'legType', 'leg_type') ?? '')}</Cell>
                <Cell>{String(field(fill, 'signal', 'signal') ?? '')}</Cell>
                <Cell>{String(field(fill, 'side', 'side') ?? '')}</Cell>
                <Cell align="right">
                  {formatFillNumber(field(fill, 'barIndex', 'bar_index'), 0)}
                </Cell>
                <Cell>{formatFillTime(field(fill, 'timeMillis', 'time_millis'))}</Cell>
                <Cell align="right">{formatFillNumber(field(fill, 'price', 'price'))}</Cell>
                <Cell align="right">{formatFillSize(field(fill, 'size', 'size'))}</Cell>
              </DataTableRow>
            )
          })}
        </tbody>
      </FillsTable>
    </TableGroup>
  )
}
