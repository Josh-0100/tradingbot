export function DailyBriefing({ content, date }: { content: string; date: string }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="font-semibold text-sm">Morning Briefing</p>
        <span className="text-xs text-gray-500">{date}</span>
      </div>
      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
        {content || 'No briefing generated yet. Add ANTHROPIC_API_KEY and call the cron endpoint to generate one.'}
      </div>
    </div>
  )
}
