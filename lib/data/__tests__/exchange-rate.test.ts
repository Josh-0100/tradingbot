import { describe, it, expect } from 'vitest'
import { convertUsdToGbp, formatGbp } from '../exchange-rate'

describe('convertUsdToGbp', () => {
  it('converts USD to GBP using the given rate', () => {
    expect(convertUsdToGbp(100, 0.8)).toBeCloseTo(80, 2)
  })

  it('rounds to 2 decimal places', () => {
    // 333.33 * 0.789 = 262.997... → 263.00
    expect(convertUsdToGbp(333.33, 0.789)).toBeCloseTo(263.0, 1)
  })

  it('returns 0 for 0 input', () => {
    expect(convertUsdToGbp(0, 0.8)).toBe(0)
  })
})

describe('formatGbp', () => {
  it('formats a number as GBP string', () => {
    expect(formatGbp(172.4)).toBe('£172.40')
  })

  it('formats large numbers with comma separator', () => {
    expect(formatGbp(10124.5)).toBe('£10,124.50')
  })
})
