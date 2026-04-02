'use client'
import { useState, useEffect } from 'react'
import { Watchlist } from '@/components/dashboard/Watchlist'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { PriceChart } from '@/components/dashboard/PriceChart'

interface SignalData {
  direction: string
  confidence_pct: number | null
  entry_price_gbp: number | null
  stop_loss_gbp: number | null
  target_gbp: number | null
  risk_reward_ratio: number | null
  reasoning: string | null
  strategy_triggered: string | null
}

function DirectionBadge({ direction }: { direction: string }) {
  const map: Record<string, string> = {
    BUY: 'bg-green-500 text-white',
    HOLD: 'bg-yellow-500 text-black',
    SELL: 'bg-red-500 text-white',
    WATCH_SELL: 'bg-red-400 text-white',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${map[direction] ?? 'bg-gray-600 text-white'}`}>
      {direction.replace('_', ' ')}
    </span>
  )
}

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [selected, setSelected] = useState<string>('')
  const [chartData, setChartData] = useState<any[]>([])
  const [signal, setSignal] = useState<SignalData | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch('/api/prices').then(r => r.json()).then(({ quotes }) => {
      setQuotes(quotes ?? [])
      if (quotes?.length) setSelected(quotes[0].ticker)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setSignal(null)
    fetch(`/api/prices/history?ticker=${selected}&days=90`)
      .then(r => r.json()).then(d => setChartData(d.bars ?? []))
    fetch(`/api/signals?ticker=${selected}`)
      .then(r => r.json()).then(d => setSignal(d.signal ?? null))
  }, [selected])

  async function generateSignal() {
    setGenerating(true)
    const res = await fetch('/api/signals', {
      method: 'POST',
      body: JSON.stringify({ ticker: selected }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    setSignal(data.signal ?? null)
    setGenerating(false)
  }

  return (
    <div className="flex h-[calc(100vh-52px)]">
      <Watchlist
        items={quotes.map(q => ({ ticker: q.ticker, priceGbp: q.priceGbp, changePercent: q.changePercent }))}
        selected={selected}
        onSelect={setSelected}
      />
      <div className="flex-1 flex flex-col overflow-auto">
        <KpiCards portfolioValueGbp={10000} signalCount={0} newsAlertCount={0} />
        <PriceChart data={chartData} ticker={selected} />

        <div className="mx-4 mb-4 p-4 bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm text-white">{selected} — Claude Analysis</span>
            {signal && <DirectionBadge direction={signal.direction} />}
          </div>

          {signal ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-2 text-xs">
                <div>
                  <span className="text-gray-500 block mb-0.5">Entry</span>
                  <strong className="text-white">{signal.entry_price_gbp ? `£${signal.entry_price_gbp.toFixed(2)}` : '—'}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Stop</span>
                  <strong className="text-red-400">{signal.stop_loss_gbp ? `£${signal.stop_loss_gbp.toFixed(2)}` : '—'}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Target</span>
                  <strong className="text-green-400">{signal.target_gbp ? `£${signal.target_gbp.toFixed(2)}` : '—'}</strong>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                {signal.strategy_triggered && `${signal.strategy_triggered} · `}
                Conf. {signal.confidence_pct ?? '—'}%
                {signal.risk_reward_ratio && ` · R:R ${signal.risk_reward_ratio.toFixed(1)}`}
              </p>
              {signal.reasoning && (
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">{signal.reasoning}</p>
              )}
            </>
          ) : (
            <p className="text-gray-600 text-xs mb-3">No signal for today. Click &quot;Generate Signal&quot; to analyse.</p>
          )}

          <button
            onClick={generateSignal}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-4 py-1.5 rounded"
          >
            {generating ? 'Analysing…' : 'Generate Signal'}
          </button>
        </div>
      </div>
    </div>
  )
}
