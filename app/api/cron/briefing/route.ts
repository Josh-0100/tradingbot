import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('daily_briefings').select('id').eq('date', today).single()
  if (existing) return NextResponse.json({ message: 'Already generated' })

  const { data: watchlist } = await supabase
    .from('stocks').select('ticker').eq('is_in_watchlist', true)

  const { data: recentSignals } = await supabase
    .from('signals')
    .select('ticker, direction, confidence_pct, reasoning, strategy_triggered')
    .gte('created_at', new Date(Date.now() - 86400000).toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'placeholder_wire_in_later') {
    const placeholder = `Morning briefing for ${today} — Claude API key not yet configured. Wire in ANTHROPIC_API_KEY to enable daily briefings.`
    await supabase.from('daily_briefings').insert({ date: today, content: placeholder })
    return NextResponse.json({ success: true, date: today, note: 'placeholder — Claude not wired in' })
  }

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: 'You are a trading analyst writing a morning briefing for a beginner trader. Use bullet points. Be concise. Flag key opportunities and risks.',
    messages: [{
      role: 'user',
      content: `Generate a morning briefing for ${today}.

Watchlist: ${(watchlist ?? []).map(s => s.ticker).join(', ')}

Recent signals:
${(recentSignals ?? []).map(s => `- ${s.ticker}: ${s.direction} (${s.confidence_pct}% conf) — ${s.strategy_triggered ?? 'no strategy'}`).join('\n')}

Write a brief, bulleted market briefing. Include: market mood, top opportunities, key risks, events to watch today.`,
    }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''
  await supabase.from('daily_briefings').insert({ date: today, content })

  return NextResponse.json({ success: true, date: today })
}
