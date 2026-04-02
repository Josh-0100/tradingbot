import { createClient } from '@/lib/supabase/server'
import { AnalysisClient } from '@/components/analysis/AnalysisClient'

export default async function AnalysisPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const todayUtc = today + 'T00:00:00Z'

  const [
    { data: briefing },
    { data: signals },
    { data: portfolio },
    { data: stocks },
    { data: trades },
  ] = await Promise.all([
    supabase.from('daily_briefings').select('content, date').eq('date', today).maybeSingle(),
    supabase.from('signals').select('*').gte('created_at', todayUtc).order('created_at', { ascending: false }).limit(20),
    supabase.from('paper_portfolio').select('gbp_balance').maybeSingle(),
    supabase.from('stocks').select('ticker').eq('is_in_watchlist', true).order('ticker'),
    supabase.from('paper_trades').select('pnl_gbp, executed_at').gte('executed_at', todayUtc),
  ])

  const tickers = (stocks ?? []).map((s: any) => s.ticker)

  // P&L: sum of today's closed trades (pnl_gbp not null)
  const closedTrades = (trades ?? []).filter((t: any) => t.pnl_gbp != null)
  const todayPnlGbp = closedTrades.length > 0
    ? closedTrades.reduce((sum: number, t: any) => sum + Number(t.pnl_gbp), 0)
    : null

  // Win rate across all time (fetch separately for accuracy)
  const { data: allClosedTrades } = await supabase
    .from('paper_trades')
    .select('pnl_gbp')
    .not('pnl_gbp', 'is', null)

  const allClosed = allClosedTrades ?? []
  const wins = allClosed.filter((t: any) => Number(t.pnl_gbp) > 0).length
  const winRate = allClosed.length > 0 ? (wins / allClosed.length) * 100 : null

  return (
    <AnalysisClient
      tickers={tickers}
      portfolioBalance={portfolio?.gbp_balance ?? 10000}
      briefingContent={briefing?.content ?? ''}
      briefingDate={briefing?.date ?? today}
      todaySignals={signals ?? []}
      todayPnlGbp={todayPnlGbp}
      winRate={winRate}
      closedTradeCount={wins}
      totalTradeCount={allClosed.length}
    />
  )
}
