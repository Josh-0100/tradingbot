'use client'
import { useState, useEffect } from 'react'
import { Watchlist } from '@/components/dashboard/Watchlist'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { PriceChart } from '@/components/dashboard/PriceChart'

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [selected, setSelected] = useState<string>('AAPL')
  const [chartData, setChartData] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [signalMsg, setSignalMsg] = useState('')

  useEffect(() => {
    fetch('/api/prices').then(r => r.json()).then(({ quotes }) => {
      setQuotes(quotes ?? [])
      if (quotes?.length) setSelected(quotes[0].ticker)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    fetch(`/api/prices/history?ticker=${selected}&days=90`)
      .then(r => r.json()).then(d => setChartData(d.bars ?? []))
  }, [selected])

  async function generateSignal() {
    setGenerating(true)
    setSignalMsg('')
    const res = await fetch('/api/signals', {
      method: 'POST',
      body: JSON.stringify({ ticker: selected }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    setSignalMsg(data.signal?.reasoning ?? data.error ?? 'Done')
    setGenerating(false)
  }

  const selectedQuote = quotes.find(q => q.ticker === selected)

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
        {selectedQuote && (
          <div className="mx-4 p-4 bg-gray-900 rounded-lg text-sm text-gray-300">
            <p className="font-semibold text-white mb-1">{selected} — Claude Analysis</p>
            {signalMsg && <p className="text-gray-400 text-xs mb-2 leading-relaxed">{signalMsg}</p>}
            {!signalMsg && <p className="text-gray-500 mb-2">Click &quot;Generate Signal&quot; to analyse this ticker.</p>}
            <button
              onClick={generateSignal}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-4 py-1.5 rounded"
            >
              {generating ? 'Analysing…' : 'Generate Signal'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
