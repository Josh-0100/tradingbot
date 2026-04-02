export function DailyBriefing({ content, date }: { content: string; date: string }) {
  const lines = content
    ? content.split('\n').map(l => l.trim()).filter(Boolean)
    : []

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="font-semibold text-sm">🤖 Claude&apos;s Morning Briefing</p>
        <span className="text-xs text-gray-500">{date}</span>
      </div>
      {lines.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {lines.map((line, i) => (
            <p key={i} className="text-xs text-gray-300 leading-relaxed">{line}</p>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-600">
          No briefing generated yet. The cron job runs at 07:00 on weekdays, or call <code className="text-gray-500">/api/cron/briefing</code> manually.
        </p>
      )}
    </div>
  )
}
