import { describe, it, expect } from 'vitest'
import { calculatePnl, calculatePositionSize } from '../execute'

describe('calculatePnl', () => {
  it('calculates profit for a long position', () => {
    const pnl = calculatePnl({ quantity: 10, avgBuyPriceGbp: 100, currentPriceGbp: 110 })
    expect(pnl).toBeCloseTo(100, 1) // 10 * (110 - 100)
  })

  it('calculates a loss correctly', () => {
    const pnl = calculatePnl({ quantity: 5, avgBuyPriceGbp: 200, currentPriceGbp: 180 })
    expect(pnl).toBeCloseTo(-100, 1)
  })

  it('returns 0 for no price movement', () => {
    const pnl = calculatePnl({ quantity: 10, avgBuyPriceGbp: 150, currentPriceGbp: 150 })
    expect(pnl).toBe(0)
  })
})

describe('calculatePositionSize', () => {
  it('returns integer number of shares', () => {
    const qty = calculatePositionSize({ balanceGbp: 10000, riskPercent: 2, priceGbp: 172 })
    expect(Number.isInteger(qty)).toBe(true)
    expect(qty).toBeGreaterThan(0)
  })

  it('does not exceed balance', () => {
    const qty = calculatePositionSize({ balanceGbp: 500, riskPercent: 100, priceGbp: 172 })
    expect(qty * 172).toBeLessThanOrEqual(500)
  })
})
