'use client'
import { useState, useEffect } from 'react'
import { StatCard } from '@/components/ui/StatCard'
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

  const buyCount = signals.filter((s: any) => s.direction === 'BUY').length
  const sellCount = signals.filter((s: any) => s.direction === 'SELL' || s.direction === 'WATCH_SELL').length

  const pnlStr = todayPnlGbp != null
    ? `${todayPnlGbp >= 0 ? '+' : ''}${formatGbp(todayPnlGbp)}`
    : '—'
  const pnlColour = todayPnlGbp == null ? 'neutral' : todayPnlGbp >= 0 ? 'green' : 'red'

  const winRateStr = winRate != null
    ? `${winRate.toFixed(0)}%`
    : '—'
  const winRateSub = closedTradeCount > 0
    ? `${closedTradeCount}/${totalTradeCount} trades`
    : 'No closed trades yet'

  return (
    <div className="p-6 space-y-6">
      {/* Ticker selector */}
      {tickers.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {tickers.map(t => (
            <button
              key={t}
              onClick={() => setSelected(t)}
              className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                selected === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Stat row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Portfolio Value" value={formatGbp(portfolioBalance)} />
        <StatCard label="Today's P&L" value={pnlStr} colour={pnlColour} />
        <StatCard label="Win Rate" value={winRateStr} sub={winRateSub} />
        <StatCard
          label="Active Signals"
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
            <span className="text-xs text-gray-500 font-normal ml-2">— click card for full reasoning</span>
          </p>
          <SignalCardGrid signals={signals} />
        </div>
      )}

      {/* News + Technical indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NewsSentiment items={newsItems} />
        <TechnicalIndicators data={indicators ?? {}} />
      </div>

      {/* Ask Claude */}
      <AskClaude ticker={selected} />
    </div>
  )
}
