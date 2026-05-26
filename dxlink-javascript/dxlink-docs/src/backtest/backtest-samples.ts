export interface BacktestSample {
  id: string
  title: string
  content: string
}

const BB_REVERSION_SCRIPT = `// Bollinger Bands Reversion (long-only) + EMA-200

strategy({
	pyramiding:     0,
	initialCapital: 10000,
	defaultQty:     100,
	defaultQtyType: "percent_of_equity",
	commission:     0.05,
	commissionType: "percent",
	slippage:       1
})

const bbLen  = input.double("BB Length", 20)
const bbMult = input.double("StdDev", 2.0)

function onTick() {
	const basis  = ta.sma(close, bbLen)
	const dev    = bbMult * ta.stdev(close, bbLen)
	const upper  = basis + dev
	const lower  = basis - dev
	const ema200 = ta.ema(close, 200)
	const trendOk = close > ema200

	if (bar.isConfirmed()) {
		if (ta.crossunder(close, lower) && trendOk && strategy.position() === 0)
			strategy.entry("long", strategy.LONG)
		if (ta.crossover(close, basis) && strategy.position() > 0)
			strategy.close("long")
		if (close < lower * 0.98 && strategy.position() > 0)
			strategy.close("long")
	}

	spline(basis,  { title: "Basis",   color: color.GRAY })
	spline(upper,  { title: "Upper",   color: color.RED })
	spline(lower,  { title: "Lower",   color: color.GREEN })
	spline(ema200, { title: "EMA 200", color: color.PURPLE })
}`

const EMA_PULLBACK_SCRIPT = `// EMA Pullback 21/200 (long-only)

strategy({
	pyramiding:     0,
	initialCapital: 10000,
	defaultQty:     100,
	defaultQtyType: "percent_of_equity",
	commission:     0.05,
	commissionType: "percent",
	slippage:       1
})

const fastEmaLen = input.double("Fast EMA (entry)", 21)
const slowEmaLen = input.double("Slow EMA (trend)", 200)

function onTick() {
	const emaFast = ta.ema(close, fastEmaLen)
	const emaSlow = ta.ema(close, slowEmaLen)

	const bullTrend     = close > emaSlow
	const pullbackEntry = bullTrend && ta.crossover(close, emaFast)
	const exitCond      = ta.crossunder(close, emaFast) && strategy.position() > 0

	if (bar.isConfirmed()) {
		if (pullbackEntry) strategy.entry("long", strategy.LONG)
		if (exitCond)      strategy.close("long")
	}

	spline(emaFast, { title: "EMA 21",  color: color.ORANGE })
	spline(emaSlow, { title: "EMA 200", color: color.PURPLE })
}`

const ICHIMOKU_SCRIPT = `// Ichimoku Cloud + Chikou

strategy({
	pyramiding:     0,
	initialCapital: 10000,
	defaultQty:     100,
	defaultQtyType: "percent_of_equity",
	commission:     0.05,
	commissionType: "percent",
	slippage:       1
})

const tenkanLen  = input.double("Tenkan-sen",     9)
const kijunLen   = input.double("Kijun-sen",     26)
const senkouBLen = input.double("Senkou Span B", 52)
const disp       = input.double("Displacement",  26)

function onTick() {
	const tenkan = ts((ta.highest(high, tenkanLen) + ta.lowest(low, tenkanLen)) / 2)
	const kijun  = ts((ta.highest(high, kijunLen)  + ta.lowest(low, kijunLen))  / 2)
	const ssa    = ts((tenkan + kijun) / 2)
	const ssb    = ts((ta.highest(high, senkouBLen) + ta.lowest(low, senkouBLen)) / 2)

	const cloudTop = Math.max(ssa, ssb)
	const cloudBot = Math.min(ssa, ssb)
	const chikou   = close[Math.floor(disp)]

	const longCond  = !isNaN(tenkan) && !isNaN(kijun)
			&& ta.crossover(tenkan, kijun) && close > cloudTop && close > chikou
	const shortCond = !isNaN(tenkan) && !isNaN(kijun)
			&& ta.crossunder(tenkan, kijun) && close < cloudBot && close < chikou

	if (bar.isConfirmed()) {
		if (longCond)  strategy.entry("long",  strategy.LONG)
		if (shortCond) strategy.entry("short", strategy.SHORT)
		if (close < kijun && strategy.position() > 0) strategy.close("long")
		if (close > kijun && strategy.position() < 0) strategy.close("short")
	}

	spline(tenkan, { title: "Tenkan", color: color.BLUE })
	spline(kijun,  { title: "Kijun",  color: color.RED })
	spline(ssa,    { title: "SSA",    color: color.GREEN })
	spline(ssb,    { title: "SSB",    color: color.RED })
}`

const MACD_EMA200_SCRIPT = `// MACD + EMA-200 trend filter

strategy({
    pyramiding:     0,
    initialCapital: 10000,
    defaultQty:     100,
    defaultQtyType: "percent_of_equity",
    commission:     0.05,
    commissionType: "percent",
    slippage:       1
})

const fastLen   = input.double("Fast EMA",   12)
const slowLen   = input.double("Slow EMA",   26)
const signalLen = input.double("Signal EMA",  9)

function onTick() {
    const macdLine   = ts(ta.ema(close, fastLen) - ta.ema(close, slowLen))
    const signalLine = ta.ema(macdLine, signalLen)
    const histLine   = macdLine - signalLine
    const ema200     = ta.ema(close, 200)
    const bullTrend  = close > ema200
    const bearTrend  = close < ema200

    if (bar.isConfirmed()) {
        if (ta.crossover(macdLine, signalLine) && macdLine < 0 && bullTrend)
            strategy.entry("long", strategy.LONG)
        if (ta.crossunder(macdLine, signalLine) && macdLine > 0 && bearTrend)
            strategy.entry("short", strategy.SHORT)
        if (ta.crossunder(macdLine, signalLine) && strategy.position() > 0)
            strategy.close("long")
        if (ta.crossover(macdLine, signalLine) && strategy.position() < 0)
            strategy.close("short")
    }

    spline(macdLine, { title: "MACD", color: color.BLUE })
    spline(signalLine, { title: "Signal", color: color.ORANGE })
    spline(histLine, {
        title: "Hist",
        style: spline.STYLE_HISTOGRAM,
        color: histLine >= 0 ? color.GREEN : color.RED
    })
    spline(0, { title: "Zero", color: color.GRAY })
}`

const RSI_MEAN_REVERSION_SCRIPT = `// RSI Mean Reversion (long-only)

strategy({
	pyramiding:     0,
	initialCapital: 10000,
	defaultQty:     100,
	defaultQtyType: "percent_of_equity",
	commission:     0.05,
	commissionType: "percent",
	slippage:       1
})

const rsiLen  = input.double("RSI Length", 14)
const osLvl   = input.double("Oversold (entry)", 40)
const exitLvl = input.double("Exit Level", 60)

function onTick() {
	const net   = ts(close - close[1])
	const total = ts(Math.abs(close[1] - close))
	const rsi   = ts(50 * (1 + ta.wima(net, rsiLen) / ta.wima(total, rsiLen)))

	if (bar.isConfirmed()) {
		if (ta.crossover(rsi, osLvl) && strategy.position() === 0)
			strategy.entry("long", strategy.LONG)
		if (rsi > exitLvl && strategy.position() > 0)
			strategy.close("long")
		if (rsi < 30 && strategy.position() > 0)
			strategy.close("long")
	}

	spline(rsi,     { title: "RSI",   color: color.BLUE })
	spline(exitLvl, { title: "Exit",  color: color.RED })
	spline(50,      { title: "Mid",   color: color.GRAY })
	spline(osLvl,   { title: "Entry", color: color.GREEN })
	spline(30,      { title: "Hard Stop", color: color.RED })
}`

const SMA_CROSSOVER_SCRIPT = `strategy({ initialCapital: 10000, defaultQty: 1 });

const lengthInput = input.double("Base length", 14, { min: 2 });

function onTick() {
    const fastMA = ta.sma(close, lengthInput);
    const slowMA = ta.sma(close, lengthInput * 2);

    if (ta.crossover(fastMA, slowMA)) {
        strategy.entry("buy", strategy.LONG);
    }
    if (ta.crossunder(fastMA, slowMA)) {
        strategy.entry("sell", strategy.SHORT);
    }

    spline(fastMA, { title: "Fast MA", color: color.AQUA });
    spline(slowMA, { title: "Slow MA", color: color.ORANGE });
}`

const SMA_21_50_CROSSOVER_SCRIPT = `// SMA 21/50 Crossover

strategy({
    pyramiding:     0,
    initialCapital: 10000,
    defaultQty:     100,
    defaultQtyType: "percent_of_equity",
    commission:     0.05,
    commissionType: "percent",
    slippage:       1,
    marginLong:     100,
    marginShort:    100
})

const fastLen = input.double("Fast SMA", 21)
const slowLen = input.double("Slow SMA", 50)

const MINTICK = 0.01
const MINTICK_DIGITS = Math.max(0, -Math.floor(Math.log10(MINTICK)))
function fmtPrice(x) {
    return Number.isFinite(Number(x)) ? Number(x).toFixed(MINTICK_DIGITS) : "NaN"
}

function fmtVol(x) {
    return Number.isFinite(Number(x)) ? String(Math.trunc(Number(x))) : "NaN"
}

function onTick() {
    const fast = ta.sma(close, fastLen)
    const slow = ta.sma(close, slowLen)

    if (bar.isConfirmed()) {
        const crossUp   = ta.crossover(fast, slow)
        const crossDown = ta.crossunder(fast, slow)

        console.log(
            "BAR  [" + bar.index() + "]" +
            " | O: " + fmtPrice(open) +
            " | H: " + fmtPrice(high) +
            " | L: " + fmtPrice(low) +
            " | C: " + fmtPrice(close) +
            " | V: " + fmtVol(volume)
        )

        console.log(
            "CALC [" + bar.index() + "]" +
            " | fastSMA(" + fastLen + "): " + fmtPrice(fast) +
            " | slowSMA(" + slowLen + "): " + fmtPrice(slow) +
            " | fast>slow: " + (fast > slow) +
            " | crossUp: "   + crossUp +
            " | crossDown: " + crossDown
        )

        if (crossUp) {
            strategy.close("short")
            strategy.entry("long", strategy.LONG)
        }
        if (crossDown) {
            strategy.close("long")
            strategy.entry("short", strategy.SHORT)
        }
    }

    spline(fast, { title: "21 SMA", color: color.ORANGE })
    spline(slow, { title: "50 SMA", color: color.BLUE })
}`

const ZSCORE_REVERSION_SCRIPT = `// Z-Score Mean Reversion (long-only) + EMA-200

strategy({
	pyramiding:     0,
	initialCapital: 10000,
	defaultQty:     100,
	defaultQtyType: "percent_of_equity",
	commission:     0.05,
	commissionType: "percent",
	slippage:       1
})

const lookback    = input.double("Lookback (days)", 30)
const entryThresh = input.double("Entry |Z|", 1.8)
const exitThresh  = input.double("Exit  |Z|", 0.3)

function onTick() {
	const mean   = ta.sma(close, lookback)
	const sd     = ta.stdev(close, lookback)
	const zScore = sd !== 0 ? (close - mean) / sd : 0

	const ema200  = ta.ema(close, 200)
	const trendOk = close > ema200

	if (bar.isConfirmed()) {
		if (zScore < -entryThresh && trendOk && strategy.position() === 0)
			strategy.entry("long", strategy.LONG)
		if (zScore > -exitThresh && strategy.position() > 0)
			strategy.close("long")
		if (zScore < -3.0 && strategy.position() > 0)
			strategy.close("long")
	}

	spline(zScore,      { title: "Z-Score", color: color.BLUE })
	spline(entryThresh, { title: "+Entry",  color: color.RED })
	spline(-entryThresh, { title: "-Entry", color: color.GREEN })
	spline(exitThresh,  { title: "+Exit",  color: color.RED })
	spline(-exitThresh, { title: "-Exit",  color: color.GREEN })
	spline(0,           { title: "Zero",   color: color.GRAY })
	spline(-3.0,        { title: "Hard Stop", color: color.GRAY })
}`

export const DEFAULT_BACKTEST_SCRIPT = SMA_CROSSOVER_SCRIPT

export const BACKTEST_SAMPLES: BacktestSample[] = [
  {
    id: 'sma-crossover',
    title: 'SMA Crossover',
    content: SMA_CROSSOVER_SCRIPT,
  },
  {
    id: 'sma-21-50-crossover',
    title: 'SMA 21/50 Crossover',
    content: SMA_21_50_CROSSOVER_SCRIPT,
  },
  {
    id: 'bb-reversion',
    title: 'BB Reversion',
    content: BB_REVERSION_SCRIPT,
  },
  {
    id: 'ema-pullback',
    title: 'EMA Pullback',
    content: EMA_PULLBACK_SCRIPT,
  },
  {
    id: 'ichimoku',
    title: 'Ichimoku',
    content: ICHIMOKU_SCRIPT,
  },
  {
    id: 'macd-ema200',
    title: 'MACD EMA 200',
    content: MACD_EMA200_SCRIPT,
  },
  {
    id: 'rsi-mean-reversion',
    title: 'RSI Mean Reversion',
    content: RSI_MEAN_REVERSION_SCRIPT,
  },
  {
    id: 'zscore-reversion',
    title: 'Z-Score Reversion',
    content: ZSCORE_REVERSION_SCRIPT,
  },
]

export function getBacktestSample(id: string): BacktestSample | undefined {
  return BACKTEST_SAMPLES.find((sample) => sample.id === id)
}
