interface NewsItem {
  headline: string
  source: string | null
  sentiment_score: number | null
  published_at: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function NewsSentiment({ items }: { items: NewsItem[] }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">News Sentiment</p>
      {items.length === 0 && (
        <p className="text-xs text-gray-600">No news items yet for this ticker.</p>
      )}
      <div className="flex flex-col gap-3">
        {items.map((item, i) => {
          const score = item.sentiment_score ?? 0
          const positive = score >= 0
          return (
            <div key={i} className={i < items.length - 1 ? 'pb-3 border-b border-gray-800' : ''}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-white leading-tight">{item.headline}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-mono shrink-0 ${positive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {positive ? '+' : ''}{score.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {item.source}{item.source && item.published_at ? ' · ' : ''}{timeAgo(item.published_at)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
