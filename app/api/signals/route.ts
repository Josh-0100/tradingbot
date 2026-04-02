import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSignal } from '@/lib/claude/signal'
import { getGbpUsdRate, convertUsdToGbp } from '@/lib/data/exchange-rate'
import { getLiveQuote, getFundamentals } from '@/lib/data/yahoo'
import { computeIndicators } from '@/lib/indicators/compute'

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const todayUtc = new Date().toISOString().split('T')[0] + 'T00:00:00Z'
  const { data: signal } = await supabase
    .from('signals')
    .select('*')
    .eq('ticker', ticker)
    .gte('created_at', todayUtc)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ signal: signal ?? null })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker } = await req.json()
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  const { data: prices } = await supabase
    .from('price_data')
    .select('close, high, low, volume, date')
    .eq('ticker', ticker)
    .order('date', { ascending: false })
    .limit(250)

  const closes = (prices ?? []).map(p => p.close).reverse()
  const highs = (prices ?? []).map(p => p.high).reverse()
  const lows = (prices ?? []).map(p => p.low).reverse()
  const volumes = (prices ?? []).map(p => p.volume).reverse()

  const indicators = computeIndicators(closes, highs, lows, volumes)

  const [quote, fundamentals, strategies, rate] = await Promise.all([
    getLiveQuote(ticker),
    getFundamentals(ticker),
    supabase.from('strategies').select('name, description, rules').eq('is_active', true),
    getGbpUsdRate(),
  ])

  const { data: news } = await supabase
    .from('news_items')
    .select('headline, sentiment_score, source')
    .eq('ticker', ticker)
    .order('published_at', { ascending: false })
    .limit(5)

  const signal = await generateSignal({
    ticker,
    companyName: ticker,
    currentPriceUsd: quote.price,
    date: new Date().toISOString().split('T')[0],
    indicators,
    news: news ?? [],
    fundamentals,
    strategies: strategies.data ?? [],
  })

  const toGbp = (v: number | null) => v != null ? convertUsdToGbp(v, rate) : null
  const { data: saved } = await supabase.from('signals').insert({
    ticker,
    direction: signal.direction,
    confidence_pct: signal.confidence_pct,
    entry_price_usd: signal.entry_usd,
    entry_price_gbp: toGbp(signal.entry_usd),
    stop_loss_usd: signal.stop_loss_usd,
    stop_loss_gbp: toGbp(signal.stop_loss_usd),
    target_usd: signal.target_usd,
    target_gbp: toGbp(signal.target_usd),
    risk_reward_ratio: signal.risk_reward_ratio,
    reasoning: signal.reasoning,
    strategy_triggered: signal.strategy_triggered,
    indicators_snapshot: indicators,
    raw_claude_response: { text: signal.raw },
  }).select().single()

  return NextResponse.json({ signal: saved })
}
