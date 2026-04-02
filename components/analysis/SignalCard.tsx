import { Badge } from '@/components/ui/Badge'
import { formatGbp } from '@/lib/utils/format'

interface SignalCardProps {
  ticker: string
  direction: string
  confidencePct: number
  entryGbp: number | null
  stopLossGbp: number | null
  targetGbp: number | null
  riskReward: number | null
  reasoning: string
  strategyTriggered: string | null
  onExecute: (direction: 'BUY' | 'SELL') => void
}

const borderColour: Record<string, string> = {
  BUY: 'border-green-500',
  SELL: 'border-red-500',
  HOLD: 'border-yellow-500',
  WATCH_SELL: 'border-red-400',
  ERROR: 'border-gray-600',
}

export function SignalCard(props: SignalCardProps) {
  return (
    <div className={`bg-gray-900 rounded-lg p-4 border-l-4 ${borderColour[props.direction] ?? 'border-gray-600'}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-lg">{props.ticker}</span>
        <Badge label={props.direction} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mb-3">
        <div><span className="text-gray-500">Entry</span><br /><strong className="text-white">{props.entryGbp ? formatGbp(props.entryGbp) : '—'}</strong></div>
        <div><span className="text-gray-500">Stop</span><br /><strong className="text-red-400">{props.stopLossGbp ? formatGbp(props.stopLossGbp) : '—'}</strong></div>
        <div><span className="text-gray-500">Target</span><br /><strong className="text-green-400">{props.targetGbp ? formatGbp(props.targetGbp) : '—'}</strong></div>
      </div>
      {props.riskReward && (
        <p className="text-xs text-gray-500 mb-2">R:R {props.riskReward.toFixed(1)} · Confidence {props.confidencePct}%</p>
      )}
      <p className="text-xs text-gray-400 mb-3 leading-relaxed">{props.reasoning}</p>
      {props.strategyTriggered && (
        <p className="text-xs text-blue-400 mb-3">Strategy: {props.strategyTriggered}</p>
      )}
      {(props.direction === 'BUY' || props.direction === 'SELL') && (
        <button
          onClick={() => props.onExecute(props.direction as 'BUY' | 'SELL')}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
        >
          Paper {props.direction}
        </button>
      )}
    </div>
  )
}
