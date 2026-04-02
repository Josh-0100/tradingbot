import { StatCard } from '@/components/ui/StatCard'
import { formatGbp } from '@/lib/utils/format'

interface KpiCardsProps {
  portfolioValueGbp: number
  signalCount: number
  newsAlertCount: number
}

export function KpiCards({ portfolioValueGbp, signalCount, newsAlertCount }: KpiCardsProps) {
  return (
    <div className="flex gap-4 p-4">
      <StatCard label="Portfolio Value" value={formatGbp(portfolioValueGbp)} />
      <StatCard label="Today's Signals" value={String(signalCount)} />
      <StatCard label="News Alerts" value={String(newsAlertCount)} />
    </div>
  )
}
