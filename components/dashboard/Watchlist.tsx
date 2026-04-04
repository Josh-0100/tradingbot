'use client'

interface WatchlistItem {
  ticker: string
  priceGbp: number
  changePercent: number
}

interface Props {
  items: WatchlistItem[]
  selected: string
  onSelect: (ticker: string) => void
  /** horizontal = mobile strip, vertical = desktop sidebar (default) */
  variant?: 'horizontal' | 'vertical'
}

export function Watchlist({ items, selected, onSelect, variant = 'vertical' }: Props) {
  if (variant === 'horizontal') {
    return (
      <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-gray-800 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}>
        {items.map(item => (
          <button
            key={item.ticker}
            onClick={() => onSelect(item.ticker)}
            className={`shrink-0 flex flex-col items-start px-3 py-2 rounded-xl text-left transition-colors border ${
              selected === item.ticker
                ? 'bg-blue-600/20 border-blue-500/50 text-white'
                : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-600'
            }`}
          >
            <span className="text-xs font-bold">{item.ticker}</span>
            <span className="text-xs text-gray-400 mt-0.5">£{item.priceGbp.toFixed(2)}</span>
            <span className={`text-[10px] font-semibold mt-0.5 ${item.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {item.changePercent >= 0 ? '▲' : '▼'} {Math.abs(item.changePercent).toFixed(2)}%
            </span>
          </button>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-gray-600 py-1">No watchlist items.</p>
        )}
      </div>
    )
  }

  return (
    <div className="w-44 bg-gray-900 border-r border-gray-800 p-3 flex flex-col gap-1 overflow-y-auto shrink-0">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-semibold">Watchlist</p>
      {items.map(item => (
        <button
          key={item.ticker}
          onClick={() => onSelect(item.ticker)}
          className={`text-left px-3 py-2.5 rounded-xl text-sm transition-colors border ${
            selected === item.ticker
              ? 'bg-blue-600/20 border-blue-500/40 text-white'
              : 'border-transparent hover:bg-gray-800 text-gray-300'
          }`}
        >
          <div className="font-bold text-sm">{item.ticker}</div>
          <div className="text-xs text-gray-400 mt-0.5">£{item.priceGbp.toFixed(2)}</div>
          <div className={`text-[11px] font-semibold mt-0.5 ${item.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {item.changePercent >= 0 ? '▲' : '▼'} {Math.abs(item.changePercent).toFixed(2)}%
          </div>
        </button>
      ))}
      {items.length === 0 && (
        <p className="text-xs text-gray-600 mt-2">No watchlist items. Run the ingestion script first.</p>
      )}
    </div>
  )
}
