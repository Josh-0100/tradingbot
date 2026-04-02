const COLOURS: Record<string, string> = {
  BUY: 'bg-green-500 text-white',
  SELL: 'bg-red-500 text-white',
  HOLD: 'bg-yellow-500 text-white',
  WATCH_SELL: 'bg-red-400 text-white',
  ERROR: 'bg-gray-500 text-white',
}

export function Badge({ label }: { label: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${COLOURS[label] ?? 'bg-gray-600 text-white'}`}>
      {label.replace('_', ' ')}
    </span>
  )
}
