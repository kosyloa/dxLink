import { TableCell, TableHeadCell } from '@dxfeed/ui-kit/Table'
import { unit } from '@dxfeed/ui-kit/utils'
import styled from 'styled-components'

import type {
  StrategyAnalytics,
  StrategyFillReport,
  StrategyTradeReport,
} from './backtest-api'
import { BacktestFillsTable } from './backtest-fills-table'
import { BacktestTradesTable } from './backtest-trades-table'
import { ContentTemplate } from '../common/content-template'
import { DataTable, DataTableRow } from '../debug-console/feed-data'

const TableGroup = styled.div`
  display: flex;
  overflow: auto;
  padding-top: ${unit(1)};
`

const Section = styled.div`
  padding-top: ${unit(2)};
`

const TableHead = styled(TableHeadCell)`
  display: table-cell;
  padding: ${unit(1.5)};
  white-space: nowrap;
`

const TableData = styled(TableCell)`
  display: table-cell;
  padding: ${unit(1.5)};
  white-space: nowrap;
`

function field<T extends Record<string, unknown>>(obj: T, camel: keyof T, snake: keyof T): unknown {
  return obj[camel] ?? obj[snake]
}

function formatNumber(value: unknown, digits = 4): string {
  if (value === undefined || value === null) {
    return '—'
  }
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return String(value)
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: digits })
}

function formatNullableNumber(value: unknown, digits = 4): string {
  if (value === null) {
    return '—'
  }
  return formatNumber(value, digits)
}

export interface BacktestResultsProps {
  strategyTradeReport?: StrategyTradeReport
  strategyFillReport?: StrategyFillReport
  strategyAnalytics?: StrategyAnalytics
}

export function BacktestResults({
  strategyTradeReport,
  strategyFillReport,
  strategyAnalytics,
}: BacktestResultsProps) {
  const performance = strategyAnalytics?.performance
  const trades = strategyTradeReport?.trades ?? []
  const fills = strategyFillReport?.fills ?? []

  const hasPerformance = performance !== undefined
  const hasTrades = trades.length > 0
  const hasFills = fills.length > 0

  if (!hasPerformance && !hasTrades && !hasFills) {
    return null
  }

  return (
    <Section>
      {hasFills && (
        <ContentTemplate title="Fills">
          <BacktestFillsTable fills={fills} />
        </ContentTemplate>
      )}

      {hasTrades && (
        <ContentTemplate title="Trades">
          <BacktestTradesTable trades={trades} />
        </ContentTemplate>
      )}

      {hasPerformance && (
        <ContentTemplate title="Performance summary">
          <TableGroup>
            <DataTable>
              <DataTableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
              </DataTableRow>
              {[
                ['Initial capital', field(performance, 'initialCapital', 'initial_capital')],
                ['Final equity', field(performance, 'finalEquity', 'final_equity')],
                ['Net profit', field(performance, 'netProfit', 'net_profit')],
                [
                  'Realized net profit',
                  field(performance, 'realizedNetProfit', 'realized_net_profit'),
                ],
                ['Gross profit', field(performance, 'grossProfit', 'gross_profit')],
                ['Gross loss', field(performance, 'grossLoss', 'gross_loss')],
                ['Profit factor', field(performance, 'profitFactor', 'profit_factor')],
                ['Commission paid', field(performance, 'commissionPaid', 'commission_paid')],
                ['Expected payoff', field(performance, 'expectedPayoff', 'expected_payoff')],
                [
                  'Total closed trades',
                  field(performance, 'totalClosedTrades', 'total_closed_trades'),
                ],
                ['Winning trades', field(performance, 'winningTrades', 'winning_trades')],
                ['Losing trades', field(performance, 'losingTrades', 'losing_trades')],
                ['Even trades', field(performance, 'evenTrades', 'even_trades')],
                [
                  'Percent profitable',
                  field(performance, 'percentProfitable', 'percent_profitable'),
                ],
                ['Avg PnL', field(performance, 'avgPnl', 'avg_pnl')],
                ['Avg winning trade', field(performance, 'avgWinningTrade', 'avg_winning_trade')],
                ['Avg losing trade', field(performance, 'avgLosingTrade', 'avg_losing_trade')],
                [
                  'Largest winning trade',
                  field(performance, 'largestWinningTrade', 'largest_winning_trade'),
                ],
                [
                  'Largest losing trade',
                  field(performance, 'largestLosingTrade', 'largest_losing_trade'),
                ],
                [
                  'Max equity drawdown',
                  field(performance, 'maxEquityDrawdown', 'max_equity_drawdown'),
                ],
                [
                  'Max equity drawdown %',
                  field(performance, 'maxEquityDrawdownPercent', 'max_equity_drawdown_percent'),
                ],
                ['Sharpe ratio', field(performance, 'sharpeRatio', 'sharpe_ratio')],
                ['Sortino ratio', field(performance, 'sortinoRatio', 'sortino_ratio')],
                [
                  'Buy & hold return %',
                  field(performance, 'buyHoldReturnPercent', 'buy_hold_return_percent'),
                ],
                [
                  'Strategy return %',
                  field(performance, 'strategyReturnPercent', 'strategy_return_percent'),
                ],
                [
                  'Strategy outperformance %',
                  field(
                    performance,
                    'strategyOutperformancePercent',
                    'strategy_outperformance_percent'
                  ),
                ],
              ].map(([label, value]) => (
                <DataTableRow key={label}>
                  <TableData>{label}</TableData>
                  <TableData>
                    {label.includes('%') || label.includes('ratio') || label.includes('factor')
                      ? formatNullableNumber(value, 6)
                      : formatNumber(value)}
                  </TableData>
                </DataTableRow>
              ))}
            </DataTable>
          </TableGroup>
        </ContentTemplate>
      )}
    </Section>
  )
}
