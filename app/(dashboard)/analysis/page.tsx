import { createClient } from '@/lib/supabase/server'
import { DailyBriefing } from '@/components/analysis/DailyBriefing'
import { TechnicalIndicators } from '@/components/analysis/TechnicalIndicators'
import { SignalCardGrid } from '@/components/analysis/SignalCardGrid'
import { AskClaude } from '@/components/analysis/AskClaude'
import { StatCard } from '@/components/ui/StatCard'
import { formatGbp } from '@/lib/utils/format'

export default async function AnalysisPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: briefing }, { data: signals }, { data: portfolio }] = await Promise.all([
    supabase.from('daily_briefings').select('content, date').eq('date', today).single(),
    supabase.from('signals').select('*').gte('created_at', today + 'T00:00:00Z').order('created_at', { ascending: false }).limit(20),
    supabase.from('paper_portfolio').select('gbp_balance').single(),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Portfolio Value" value={formatGbp(portfolio?.gbp_balance ?? 10000)} />
        <StatCard label="Today's P&L" value="—" />
        <StatCard label="Active Signals" value={String(signals?.length ?? 0)} />
        <StatCard label="Win Rate" value="—" sub="No closed trades yet" />
      </div>

      <DailyBriefing content={briefing?.content ?? ''} date={briefing?.date ?? today} />

      {signals && signals.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-3">Today&apos;s Signals</p>
          <SignalCardGrid signals={signals} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TechnicalIndicators data={{}} />
        <AskClaude ticker="AAPL" />
      </div>
    </div>
  )
}
