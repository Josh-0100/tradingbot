import {
  RSI, MACD, SMA, EMA, BollingerBands, ATR, Stochastic, OBV
} from 'technicalindicators'

export function computeSma(closes: number[], period: number): number | null {
  if (closes.length < period) return null
  const result = SMA.calculate({ period, values: closes })
  return result.at(-1) ?? null
}

export function computeRsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null
  const result = RSI.calculate({ period, values: closes })
  return result.at(-1) ?? null
}

export interface IndicatorSnapshot {
  rsi_14: number | null
  macd_line: number | null
  macd_signal: number | null
  macd_hist: number | null
  sma_20: number | null
  sma_50: number | null
  sma_200: number | null
  ema_12: number | null
  ema_26: number | null
  bb_upper: number | null
  bb_mid: number | null
  bb_lower: number | null
  atr_14: number | null
  stoch_k: number | null
  stoch_d: number | null
  obv: number | null
}

export function computeIndicators(
  closes: number[],
  highs?: number[],
  lows?: number[],
  volumes?: number[]
): IndicatorSnapshot {
  const macdResult = closes.length >= 35
    ? MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false }).at(-1)
    : null

  const bbResult = closes.length >= 20
    ? BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 }).at(-1)
    : null

  const atrResult = highs && lows && closes.length >= 15
    ? ATR.calculate({ period: 14, high: highs, low: lows, close: closes }).at(-1) ?? null
    : null

  const stochResult = highs && lows && closes.length >= 15
    ? Stochastic.calculate({ period: 14, signalPeriod: 3, high: highs, low: lows, close: closes }).at(-1)
    : null

  const obvResult = volumes && closes.length >= 2
    ? OBV.calculate({ close: closes, volume: volumes }).at(-1) ?? null
    : null

  return {
    rsi_14: computeRsi(closes),
    macd_line: macdResult?.MACD ?? null,
    macd_signal: macdResult?.signal ?? null,
    macd_hist: macdResult?.histogram ?? null,
    sma_20: computeSma(closes, 20),
    sma_50: computeSma(closes, 50),
    sma_200: computeSma(closes, 200),
    ema_12: closes.length >= 12 ? (EMA.calculate({ period: 12, values: closes }).at(-1) ?? null) : null,
    ema_26: closes.length >= 26 ? (EMA.calculate({ period: 26, values: closes }).at(-1) ?? null) : null,
    bb_upper: bbResult?.upper ?? null,
    bb_mid: bbResult?.middle ?? null,
    bb_lower: bbResult?.lower ?? null,
    atr_14: atrResult,
    stoch_k: stochResult?.k ?? null,
    stoch_d: stochResult?.d ?? null,
    obv: obvResult,
  }
}
