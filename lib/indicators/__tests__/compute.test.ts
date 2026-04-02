import { describe, it, expect } from 'vitest'
import { computeRsi, computeSma, computeIndicators } from '../compute'

const closes = [44,44.34,44.83,45.1,45.15,43.61,44.33,44.83,45.1,45.15,
                43.61,44.33,44.83,45.1,45.15,44,44.34,44.83,45.1,45.15]

describe('computeSma', () => {
  it('returns null when not enough data', () => {
    expect(computeSma([1, 2, 3], 5)).toBeNull()
  })

  it('computes the simple moving average of the last N values', () => {
    const sma = computeSma([1, 2, 3, 4, 5], 3)
    expect(sma).toBeCloseTo(4, 1) // (3+4+5)/3 = 4
  })
})

describe('computeRsi', () => {
  it('returns null when fewer than 15 data points', () => {
    expect(computeRsi([1, 2, 3], 14)).toBeNull()
  })

  it('returns a number between 0 and 100', () => {
    const rsi = computeRsi(closes, 14)
    expect(rsi).not.toBeNull()
    expect(rsi!).toBeGreaterThan(0)
    expect(rsi!).toBeLessThan(100)
  })
})

describe('computeIndicators', () => {
  it('returns an object with all expected keys', () => {
    const prices = Array.from({ length: 250 }, (_, i) => 100 + Math.sin(i / 10) * 10)
    const result = computeIndicators(prices)
    expect(result).toHaveProperty('rsi_14')
    expect(result).toHaveProperty('macd_line')
    expect(result).toHaveProperty('sma_50')
    expect(result).toHaveProperty('sma_200')
    expect(result).toHaveProperty('bb_upper')
    expect(result).toHaveProperty('atr_14')
  })

  it('returns nulls for short price series', () => {
    const result = computeIndicators([100, 101, 102])
    expect(result.sma_200).toBeNull()
    expect(result.sma_50).toBeNull()
  })
})
