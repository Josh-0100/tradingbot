'use client'
interface WatchlistItem {
  ticker: string
  priceGbp: number
  changePercent: number
}

export function Watchlist({
  items,
  selected,
  onSelect,
}: {
  items: WatchlistItem[]
  selected: string
  onSelect: (ticker: string) => void
}) {
  return (
    <div className="w-40 bg-gray-900 border-r border-gray-800 p-3 flex flex-col gap-1 overflow-y-auto">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Watchlist</p>
      {items.map(item => (
        <button
          key={item.ticker}
          onClick={() => onSelect(item.ticker)}
          className={`text-left px-2 py-1.5 rounded text-sm ${
            selected === item.ticker ? 'bg-blue-700' : 'hover:bg-gray-800'
          }`}
        >
          <div className="font-semibold">{item.ticker}</div>
          <div className="text-xs text-gray-400">
            £{item.priceGbp.toFixed(2)}
            <span className={item.changePercent >= 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
              {item.changePercent >= 0 ? '▲' : '▼'} {Math.abs(item.changePercent).toFixed(2)}%
            </span>
          </div>
        </button>
      ))}
      {items.length === 0 && (
        <p className="text-xs text-gray-600">No watchlist items. Run the ingestion script first.</p>
      )}
    </div>
  )
}
