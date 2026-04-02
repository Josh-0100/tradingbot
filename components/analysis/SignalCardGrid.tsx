'use client'
import { SignalCard } from './SignalCard'

export function SignalCardGrid({ signals }: { signals: any[] }) {
  async function executeTrade(ticker: string, direction: 'BUY' | 'SELL', signalId: string) {
    const res = await fetch('/api/paper-trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, direction, quantity: 1, signalId }),
    })
    const data = await res.json()
    if (data.error) alert(`Error: ${data.error}`)
    else alert(`Paper ${direction} submitted for ${ticker}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {signals.map(s => (
        <SignalCard
          key={s.id}
          ticker={s.ticker}
          direction={s.direction}
          confidencePct={s.confidence_pct}
          entryGbp={s.entry_price_gbp}
          stopLossGbp={s.stop_loss_gbp}
          targetGbp={s.target_gbp}
          riskReward={s.risk_reward_ratio}
          reasoning={s.reasoning}
          strategyTriggered={s.strategy_triggered}
          onExecute={(dir) => executeTrade(s.ticker, dir, s.id)}
        />
      ))}
    </div>
  )
}
