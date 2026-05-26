import { unit } from '@dxfeed/ui-kit/utils'
import styled from 'styled-components'

const ErrorDetails = styled.pre`
  margin: 0;
  padding: ${unit(0.5)} 0;
  max-width: 520px;
  max-height: 360px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.45;
  color: inherit;
`

export interface BacktestErrorTooltipProps {
  summary: string
  details?: string
}

export function BacktestErrorTooltipContent({ summary, details }: BacktestErrorTooltipProps) {
  const text = details && details !== summary ? `${summary}\n\n${details}` : summary
  return <ErrorDetails>{text}</ErrorDetails>
}
