import { describe, it, expect } from 'vitest'
import { buildSignalPrompt, parseSignalResponse } from '../signal'

const mockInput = {
  ticker: 'AAPL',
  companyName: 'Apple Inc.',
  currentPriceUsd: 218.50,
  date: '2026-04-01',
  indicators: { rsi_14: 42.3, macd_line: 0.5, macd_signal: 0.3, sma_50: 210, sma_200: 195 },
  news: [{ headline: 'iPhone demand strong in Asia', sentiment_score: 0.82, source: 'Reuters' }],
  fundamentals: { peRatio: 28.5, eps: 6.57, revenueGrowth: 0.06 },
  strategies: [{ name: 'RSI Reversal', description: 'Buy when RSI < 30', rules: {} }],
}

describe('buildSignalPrompt', () => {
  it('includes the ticker in the prompt', () => {
    const { userMessage } = buildSignalPrompt(mockInput)
    expect(userMessage).toContain('AAPL')
  })

  it('includes the current price', () => {
    const { userMessage } = buildSignalPrompt(mockInput)
    expect(userMessage).toContain('218.50')
  })

  it('includes strategy names in the system message', () => {
    const { systemMessage } = buildSignalPrompt(mockInput)
    expect(systemMessage).toContain('RSI Reversal')
  })
})

describe('parseSignalResponse', () => {
  it('parses a valid Claude JSON response', () => {
    const raw = JSON.stringify({
      direction: 'BUY',
      confidence_pct: 72,
      entry_usd: 218.50,
      stop_loss_usd: 210.00,
      target_usd: 230.00,
      reasoning: 'RSI recovering from oversold territory',
      strategy_triggered: 'RSI Reversal',
      risk_reward_ratio: 1.9,
    })
    const result = parseSignalResponse(raw)
    expect(result.direction).toBe('BUY')
    expect(result.confidence_pct).toBe(72)
    expect(result.entry_usd).toBe(218.50)
  })

  it('returns an ERROR signal for invalid JSON', () => {
    const result = parseSignalResponse('not json { broken')
    expect(result.direction).toBe('ERROR')
    expect(result.reasoning).toContain('parse')
  })

  it('clamps confidence_pct to 0-100', () => {
    const raw = JSON.stringify({ direction: 'BUY', confidence_pct: 150 })
    const result = parseSignalResponse(raw)
    expect(result.confidence_pct).toBeLessThanOrEqual(100)
  })
})
