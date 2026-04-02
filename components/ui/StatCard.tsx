interface StatCardProps {
  label: string
  value: string
  sub?: string
  colour?: 'green' | 'red' | 'neutral'
}

export function StatCard({ label, value, sub, colour = 'neutral' }: StatCardProps) {
  const valueColour = colour === 'green' ? 'text-green-400' : colour === 'red' ? 'text-red-400' : 'text-white'
  return (
    <div className="bg-gray-900 rounded-lg px-4 py-3 flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-gray-500">{label}</span>
      <span className={`text-lg font-bold ${valueColour}`}>{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}
