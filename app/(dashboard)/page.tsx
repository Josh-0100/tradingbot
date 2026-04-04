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
  const map: Record<string, { bg: string; text: string }> = {
    BUY:        { bg: 'bg-green-500/20 border border-green-500/40', text: 'text-green-400' },
    HOLD:       { bg: 'bg-yellow-500/20 border border-yellow-500/40', text: 'text-yellow-400' },
    SELL:       { bg: 'bg-red-500/20 border border-red-500/40', text: 'text-red-400' },
    WATCH_SELL: { bg: 'bg-red-400/20 border border-red-400/40', text: 'text-red-300' },
  }
  const style = map[direction] ?? { bg: 'bg-gray-700', text: 'text-gray-300' }
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
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

  const watchlistProps = {
    items: quotes.map(q => ({ ticker: q.ticker, priceGbp: q.priceGbp, changePercent: q.changePercent })),
    selected,
    onSelect: setSelected,
  }

  return (
    <>
      {/* Mobile layout */}
      <div className="flex flex-col h-full md:hidden">
        <Watchlist {...watchlistProps} variant="horizontal" />
        <div className="flex-1 overflow-auto">
          <KpiCards portfolioValueGbp={10000} signalCount={0} newsAlertCount={0} />
          <PriceChart data={chartData} ticker={selected} />
          <SignalPanel selected={selected} signal={signal} generating={generating} onGenerate={generateSignal} />
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex h-[calc(100vh-52px)]">
        <Watchlist {...watchlistProps} variant="vertical" />
        <div className="flex-1 flex flex-col overflow-auto">
          <KpiCards portfolioValueGbp={10000} signalCount={0} newsAlertCount={0} />
          <PriceChart data={chartData} ticker={selected} />
          <SignalPanel selected={selected} signal={signal} generating={generating} onGenerate={generateSignal} />
        </div>
      </div>
    </>
  )
}

function SignalPanel({ selected, signal, generating, onGenerate }: {
  selected: string
  signal: SignalData | null
  generating: boolean
  onGenerate: () => void
}) {
  return (
    <div className="mx-4 mb-4 p-4 bg-gray-900 rounded-2xl border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-sm text-white">{selected} — Claude Analysis</span>
        {signal && <DirectionBadge direction={signal.direction} />}
      </div>

      {signal ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: 'Entry',  value: signal.entry_price_gbp  ? `£${signal.entry_price_gbp.toFixed(2)}`  : '—', colour: 'text-white'      },
              { label: 'Stop',   value: signal.stop_loss_gbp    ? `£${signal.stop_loss_gbp.toFixed(2)}`    : '—', colour: 'text-red-400'    },
              { label: 'Target', value: signal.target_gbp       ? `£${signal.target_gbp.toFixed(2)}`       : '—', colour: 'text-green-400'  },
            ].map(({ label, value, colour }) => (
              <div key={label} className="bg-gray-800 rounded-xl p-3">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">{label}</span>
                <span className={`font-bold text-sm ${colour}`}>{value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mb-2">
            {signal.strategy_triggered && `${signal.strategy_triggered} · `}
            Conf. {signal.confidence_pct ?? '—'}%
            {signal.risk_reward_ratio && ` · R:R ${signal.risk_reward_ratio.toFixed(1)}`}
          </p>
          {signal.reasoning && (
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 mb-3">{signal.reasoning}</p>
          )}
        </>
      ) : (
        <p className="text-gray-600 text-xs mb-3">No signal for today. Click &quot;Generate Signal&quot; to analyse.</p>
      )}

      <button
        onClick={onGenerate}
        disabled={generating}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
      >
        {generating ? 'Analysing…' : 'Generate Signal'}
      </button>
    </div>
  )
}
