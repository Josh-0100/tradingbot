import { createClient } from '@/lib/supabase/server'
export { formatGbp } from '@/lib/utils/format'

const CACHE_DURATION_MS = 30 * 60 * 1000 // 30 minutes

export function convertUsdToGbp(usd: number, rate: number): number {
  return Math.round(usd * rate * 100) / 100
}

export async function getGbpUsdRate(): Promise<number> {
  const supabase = await createClient()

  // Check cache first
  const { data: cached } = await supabase
    .from('exchange_rates')
    .select('rate, fetched_at')
    .eq('pair', 'GBPUSD')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single()

  if (cached) {
    const age = Date.now() - new Date(cached.fetched_at).getTime()
    if (age < CACHE_DURATION_MS) return cached.rate
  }

  // Fetch fresh rate
  const res = await fetch(
    `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/pair/USD/GBP`
  )
  if (!res.ok) {
    if (cached) return cached.rate
    throw new Error('Exchange rate unavailable and no cache exists')
  }
  const json = await res.json()
  const rate = json.conversion_rate as number

  await supabase.from('exchange_rates').insert({ pair: 'GBPUSD', rate })

  return rate
}
