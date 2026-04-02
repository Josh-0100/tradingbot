'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Bar { date: string; close: number }

export function PriceChart({ data, ticker }: { data: Bar[]; ticker: string }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
      No price data for {ticker}
    </div>
  )
  return (
    <div className="p-4">
      <p className="text-sm text-gray-400 mb-2">{ticker} — Daily Close (GBP)</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} width={60} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff' }}
            formatter={(v) => [`£${Number(v).toFixed(2)}`, 'Close']}
          />
          <Line type="monotone" dataKey="close" stroke="#3B82F6" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
