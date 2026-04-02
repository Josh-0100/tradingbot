import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGbpUsdRate, convertUsdToGbp } from '@/lib/data/exchange-rate'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ticker = req.nextUrl.searchParams.get('ticker') ?? 'AAPL'
  const days = Number(req.nextUrl.searchParams.get('days') ?? 90)
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]

  const { data: prices } = await supabase
    .from('price_data').select('date, close')
    .eq('ticker', ticker).gte('date', since)
    .order('date', { ascending: true })

  const rate = await getGbpUsdRate()
  const bars = (prices ?? []).map(p => ({
    date: p.date,
    close: convertUsdToGbp(p.close, rate),
  }))

  return NextResponse.json({ bars })
}
