import { Button } from '@dxfeed/ui-kit/Button'
import { HelperMessage } from '@dxfeed/ui-kit/HelperMessage'
import { IconButton } from '@dxfeed/ui-kit/IconButton'
import { Menu, MenuItem } from '@dxfeed/ui-kit/Menu'
import { Text } from '@dxfeed/ui-kit/Text'
import { TextField } from '@dxfeed/ui-kit/TextField'
import { ToggleButton } from '@dxfeed/ui-kit/ToggleButton'
import { Tooltip } from '@dxfeed/ui-kit/Tooltip'
import { unit } from '@dxfeed/ui-kit/utils'
import { useState } from 'react'
import AceEditor from 'react-ace'
import styled from 'styled-components'

import type { BacktestParams } from './backtest-api'
import { BacktestErrorTooltipContent } from './backtest-error-tooltip'
import { BACKTEST_SAMPLES } from './backtest-samples'
import {
  createDefaultFromTimeLocal,
  createDefaultToTimeLocal,
  datetimeLocalToIsoUtc,
  DEFAULT_BACKTEST_SCRIPT,
  DEFAULT_BACKTEST_SYMBOL,
  DEFAULT_BACKTEST_URL,
} from './defaults'
import { ContentTemplate } from '../common/content-template'
import { ErrorIcon, JSIcon } from '../debug-console/icons'
import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/theme-textmate'
import '../debug-console/ace-dxscript-mode'

const Root = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
`

const FieldsGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: ${unit(1.5)};
`

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: ${unit(1)};
  width: 100%;
`

const SymbolField = styled(FieldWrapper)`
  grid-column: 1 / -1;
`

const DatetimeInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: ${unit(1)} ${unit(1.25)};
  font-size: 14px;
  line-height: 20px;
  border: 1px solid ${({ theme }) => theme.palette.separator.primary};
  border-radius: 4px;
  background-color: ${({ theme }) => theme.background.primary.main};
  color: ${({ theme }) => theme.palette.primary.main};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.palette.primary.main};
  }
`

const DatetimeLabel = styled(Text)`
  padding-bottom: ${unit(0.5)};
`

const TopPanel = styled.div`
  display: flex;
  flex-direction: row;
  border-top: 1px solid ${({ theme }) => theme.palette.separator.primary};
  padding-bottom: ${unit(1)};
  padding-top: ${unit(1)};
`

const LangWrapper = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
`

const LangButton = styled(ToggleButton)`
  margin-right: ${unit(1)};
  display: flex;
  align-items: center;
`

const CodeEditorGroup = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: ${unit(1)};
  width: 100%;
`

const CodeEditorInput = styled.div`
  width: 100%;
`

const CodeEditorHelp = styled.div`
  width: 100%;
  display: flex;
  justify-content: end;
`

const ExampleButton = styled(Button)`
  margin-top: ${unit(1)};
`

const ExampleItem = styled(MenuItem)`
  cursor: pointer;
`

const ExampleText = styled(Text)`
  display: flex;
  flex-grow: 1;
  min-width: 200px;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid ${({ theme }) => theme.palette.separator.primary};
  padding-top: ${unit(1)};
`

const JSLogo = styled(JSIcon)`
  width: 16px;
  height: 16px;
  margin-right: 4px;
  margin-bottom: 2px;
`

const ErrorButton = styled(IconButton)`
  color: ${({ theme }) => theme.palette.red.main};
`

const ErrorWrapper = styled.div`
  display: flex;
  align-items: center;
`

export interface BacktestFormSubmit {
  baseUrl: string
  params: BacktestParams
  content: string
}

export interface BacktestFormError {
  summary: string
  details?: string
}

export interface BacktestFormProps {
  loading?: boolean
  error?: BacktestFormError
  onCalculate: (submit: BacktestFormSubmit) => void
}

export function BacktestForm({ loading, error, onCalculate }: BacktestFormProps) {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BACKTEST_URL)
  const [symbol, setSymbol] = useState(DEFAULT_BACKTEST_SYMBOL)
  const [fromTimeLocal, setFromTimeLocal] = useState(createDefaultFromTimeLocal)
  const [toTimeLocal, setToTimeLocal] = useState(createDefaultToTimeLocal)
  const [script, setScript] = useState(DEFAULT_BACKTEST_SCRIPT)
  const [localError, setLocalError] = useState<BacktestFormError | undefined>()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const displayError = localError ?? error

  const handleCalculate = () => {
    setLocalError(undefined)
    try {
      if (!symbol.trim()) {
        throw Object.assign(new Error('symbol is required'), {
          details: 'Validation failed before the request was sent.\n\nsymbol is required',
        })
      }

      const params: BacktestParams = {
        symbol: symbol.trim(),
        from_time: datetimeLocalToIsoUtc(fromTimeLocal),
        to_time: datetimeLocalToIsoUtc(toTimeLocal),
      }

      onCalculate({ baseUrl, params, content: script })
    } catch (e) {
      if (e instanceof Error) {
        const details = 'details' in e && typeof e.details === 'string' ? e.details : e.message
        setLocalError({ summary: e.message, details })
      } else {
        const text = String(e)
        setLocalError({ summary: text, details: text })
      }
    }
  }

  return (
    <Root>
      <ContentTemplate title="Backtest request">
        <FieldWrapper>
          <TextField
            label="URL"
            value={baseUrl}
            fullWidth
            onChange={(e) => setBaseUrl(e.target.value)}
          />
          <HelperMessage state="normal">
            Base URL for the backtesting service (defaults to this page origin). Requests on the
            same host are proxied in dev to avoid CORS.
          </HelperMessage>
        </FieldWrapper>

        <FieldsGroup>
          <SymbolField>
            <TextField
              label="Symbol"
              value={symbol}
              fullWidth
              onChange={(e) => setSymbol(e.target.value)}
            />
            <HelperMessage state="normal">
              <a
                href="https://kb.dxfeed.com/en/data-access/rest-api.html#candle-symbols"
                target="_blank"
                rel="noreferrer"
              >
                Candle symbols
              </a>
            </HelperMessage>
          </SymbolField>
          <FieldWrapper>
            <DatetimeLabel level={4}>From time</DatetimeLabel>
            <DatetimeInput
              type="datetime-local"
              value={fromTimeLocal}
              onChange={(e) => setFromTimeLocal(e.target.value)}
            />
          </FieldWrapper>
          <FieldWrapper>
            <DatetimeLabel level={4}>To time</DatetimeLabel>
            <DatetimeInput
              type="datetime-local"
              value={toTimeLocal}
              onChange={(e) => setToTimeLocal(e.target.value)}
            />
          </FieldWrapper>
        </FieldsGroup>

        <TopPanel>
          <LangWrapper>
            <LangButton pressed={true}>
              <JSLogo /> dxScript/JS
            </LangButton>
          </LangWrapper>
          <ErrorWrapper>
            {displayError && (
              <Tooltip
                content={
                  <BacktestErrorTooltipContent
                    summary={displayError.summary}
                    details={displayError.details}
                  />
                }
                placement="left-start"
                enableHoverableContent={true}
              >
                {(triggerProps) => (
                  <ErrorButton type="button" kind="ghost" size="small" {...triggerProps}>
                    <ErrorIcon />
                  </ErrorButton>
                )}
              </Tooltip>
            )}
          </ErrorWrapper>
        </TopPanel>

        <CodeEditorGroup>
          <CodeEditorInput>
            <AceEditor
              placeholder="Strategy code"
              mode="dxscript"
              theme="textmate"
              name="backtest-script"
              onChange={(value) => setScript(value)}
              fontSize={14}
              lineHeight={18}
              showPrintMargin={true}
              showGutter={true}
              highlightActiveLine={true}
              value={script}
              width="100%"
              height="320px"
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: false,
                showLineNumbers: true,
                tabSize: 1,
              }}
            />
          </CodeEditorInput>
          <CodeEditorHelp>
            <ExampleButton color="secondary" onClick={(event) => setAnchorEl(event.currentTarget)}>
              Try examples
            </ExampleButton>
            <Menu
              anchorEl={anchorEl}
              isOpen={!!anchorEl}
              placement="left-end"
              onClose={() => setAnchorEl(null)}
            >
              {BACKTEST_SAMPLES.map((sample) => (
                <ExampleItem
                  key={sample.id}
                  onClick={() => {
                    setAnchorEl(null)
                    setScript(sample.content)
                  }}
                >
                  <ExampleText color="inherit">{sample.title}</ExampleText>
                </ExampleItem>
              ))}
            </Menu>
          </CodeEditorHelp>
        </CodeEditorGroup>

        <Actions>
          <Button type="button" kind="outline" onClick={handleCalculate} disabled={loading}>
            {loading ? 'Calculating…' : 'Calculate'}
          </Button>
        </Actions>
      </ContentTemplate>
    </Root>
  )
}
