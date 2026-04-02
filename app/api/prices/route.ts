import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLiveQuotes } from '@/lib/data/yahoo'
import { getGbpUsdRate, convertUsdToGbp } from '@/lib/data/exchange-rate'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: watchlist } = await supabase
    .from('stocks')
    .select('ticker')
    .eq('is_in_watchlist', true)

  const tickers = (watchlist ?? []).map(s => s.ticker)
  if (!tickers.length) return NextResponse.json({ quotes: [], rate: 1 })

  const [quotes, rate] = await Promise.all([getLiveQuotes(tickers), getGbpUsdRate()])

  const gbpQuotes = quotes.map(q => ({
    ...q,
    priceGbp: convertUsdToGbp(q.price, rate),
    rate,
  }))

  return NextResponse.json({ quotes: gbpQuotes, rate })
}
