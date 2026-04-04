'use client'
import { useState, useEffect } from 'react'
import { DailyBriefing } from '@/components/analysis/DailyBriefing'
import { SignalCardGrid } from '@/components/analysis/SignalCardGrid'
import { TechnicalIndicators } from '@/components/analysis/TechnicalIndicators'
import { NewsSentiment } from '@/components/analysis/NewsSentiment'
import { AskClaude } from '@/components/analysis/AskClaude'
import { formatGbp } from '@/lib/utils/format'

interface Props {
  tickers: string[]
  portfolioBalance: number
  briefingContent: string
  briefingDate: string
  todaySignals: any[]
  todayPnlGbp: number | null
  winRate: number | null
  closedTradeCount: number
  totalTradeCount: number
}

function StatCard({ label, value, sub, colour }: { label: string; value: string; sub?: string; colour?: 'green' | 'red' | 'neutral' }) {
  const valueColour = colour === 'green' ? 'text-green-400' : colour === 'red' ? 'text-red-400' : 'text-white'
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">{label}</p>
      <p className={`text-xl font-bold ${valueColour}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export function AnalysisClient({
  tickers,
  portfolioBalance,
  briefingContent,
  briefingDate,
  todaySignals,
  todayPnlGbp,
  winRate,
  closedTradeCount,
  totalTradeCount,
}: Props) {
  const [selected, setSelected] = useState(tickers[0] ?? 'AAPL')
  const [indicators, setIndicators] = useState<any>(null)
  const [newsItems, setNewsItems] = useState<any[]>([])
  const [signals, setSignals] = useState(todaySignals)

  useEffect(() => {
    setIndicators(null)
    setNewsItems([])
    fetch(`/api/indicators?ticker=${selected}`).then(r => r.json()).then(d => setIndicators(d.indicators ?? null))
    fetch(`/api/news?ticker=${selected}`).then(r => r.json()).then(d => setNewsItems(d.items ?? []))
    fetch(`/api/signals?ticker=${selected}`).then(r => r.json()).then(d => {
      if (d.signal) setSignals([d.signal])
    })
  }, [selected])

  const buyCount  = signals.filter((s: any) => s.direction === 'BUY').length
  const sellCount = signals.filter((s: any) => s.direction === 'SELL' || s.direction === 'WATCH_SELL').length

  const pnlStr    = todayPnlGbp != null ? `${todayPnlGbp >= 0 ? '+' : ''}${formatGbp(todayPnlGbp)}` : '—'
  const pnlColour = todayPnlGbp == null ? 'neutral' : todayPnlGbp >= 0 ? 'green' : 'red'
  const winRateStr  = winRate != null ? `${winRate.toFixed(0)}%` : '—'
  const winRateSub  = closedTradeCount > 0 ? `${closedTradeCount}/${totalTradeCount} trades` : 'No closed trades yet'

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">

      {/* Ticker strip */}
      {tickers.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {tickers.map(t => (
            <button
              key={t}
              onClick={() => setSelected(t)}
              className={`shrink-0 text-xs px-4 py-2 rounded-full font-semibold transition-colors border ${
                selected === t
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Stat cards — 2×2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Portfolio" value={formatGbp(portfolioBalance)} />
        <StatCard label="Today's P&L" value={pnlStr} colour={pnlColour as any} />
        <StatCard label="Win Rate" value={winRateStr} sub={winRateSub} />
        <StatCard
          label="Signals"
          value={String(signals.length)}
          sub={signals.length > 0 ? `↑${buyCount} BUY  ↓${sellCount} SELL` : undefined}
        />
      </div>

      {/* Morning Briefing */}
      <DailyBriefing content={briefingContent} date={briefingDate} />

      {/* Signal cards */}
      {signals.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-3">
            Today&apos;s Signals
            <span className="text-xs text-gray-500 font-normal ml-2">— tap card for full reasoning</span>
          </p>
          <SignalCardGrid signals={signals} />
        </div>
      )}

      {/* News + Technical — stack on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <NewsSentiment items={newsItems} />
        <TechnicalIndicators data={indicators ?? {}} />
      </div>

      {/* Ask Claude */}
      <AskClaude ticker={selected} />
    </div>
  )
}
