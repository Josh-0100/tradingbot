import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question, ticker, url, notes } = await req.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'placeholder_wire_in_later') {
    return NextResponse.json({
      answer: 'Claude is not yet configured. Add your ANTHROPIC_API_KEY to .env.local to enable this feature.',
    })
  }

  let fetchedContent = ''
  if (url) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      const html = await res.text()
      fetchedContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 8000)
    } catch {
      fetchedContent = '[Failed to fetch URL content]'
    }
  }

  const contextParts: string[] = []
  if (fetchedContent) contextParts.push(`[Fetched from ${url}]:\n${fetchedContent}`)
  if (notes) contextParts.push(`[User research notes]:\n${notes}`)

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a trading analyst assistant. The user is a beginner trader. Answer clearly and explain any jargon. Current ticker in focus: ${ticker}.`,
    messages: [{
      role: 'user',
      content: contextParts.length
        ? `Additional context:\n${contextParts.join('\n\n')}\n\nQuestion: ${question}`
        : question,
    }],
  })

  const answer = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ answer })
}
