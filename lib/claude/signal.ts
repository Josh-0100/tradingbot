import Anthropic from '@anthropic-ai/sdk'
import type { IndicatorSnapshot } from '@/lib/indicators/compute'

interface SignalInput {
  ticker: string
  companyName: string
  currentPriceUsd: number
  date: string
  indicators: IndicatorSnapshot | Record<string, number | null>
  news: { headline: string; sentiment_score: number | null; source: string }[]
  fundamentals: { peRatio: number | null; eps: number | null; revenueGrowth: number | null }
  strategies: { name: string; description: string; rules: unknown }[]
  vwap?: number | null
  macroBullets?: string[]
}

export interface SignalOutput {
  direction: 'BUY' | 'SELL' | 'HOLD' | 'WATCH_SELL' | 'ERROR'
  confidence_pct: number
  entry_usd: number | null
  stop_loss_usd: number | null
  target_usd: number | null
  reasoning: string
  strategy_triggered: string | null
  risk_reward_ratio: number | null
  raw: string
}

export function buildSignalPrompt(input: SignalInput): {
  systemMessage: string
  userMessage: string
} {
  const strategyList = input.strategies
    .map(s => `- ${s.name}: ${s.description}`)
    .join('\n')

  const systemMessage = `You are a professional trading analyst. Analyse the given stock using the data provided and the following active strategies:

${strategyList}

Rules:
- Never invent or estimate data not provided to you.
- If no strategy is triggered, return direction: "HOLD".
- All prices in your response must be in USD (the caller converts to GBP).
- Reasoning must be in plain English, beginner-friendly — explain any jargon.
- Output JSON only, no surrounding text.`

  const newsText = input.news.length
    ? input.news.map(n => `  - "${n.headline}" (${n.source}, sentiment: ${n.sentiment_score ?? 'unscored'})`).join('\n')
    : '  No recent news available.'

  const indicatorLines = Object.entries(input.indicators)
    .map(([k, v]) => `  ${k}: ${v ?? 'N/A'}`)
    .join('\n')

  const userMessage = `Analyse ${input.ticker} (${input.companyName}).

Current price (USD): ${input.currentPriceUsd.toFixed(2)}
Date: ${input.date}

Technical indicators (daily):
${indicatorLines}
${input.vwap ? `  VWAP (intraday): ${input.vwap}` : ''}

Recent news:
${newsText}

Fundamentals:
  P/E ratio: ${input.fundamentals.peRatio ?? 'N/A'}
  EPS: ${input.fundamentals.eps ?? 'N/A'}
  Revenue growth YoY: ${input.fundamentals.revenueGrowth != null ? (input.fundamentals.revenueGrowth * 100).toFixed(1) + '%' : 'N/A'}

${input.macroBullets?.length ? 'Macro context:\n' + input.macroBullets.map(b => '  ' + b).join('\n') : ''}

Return JSON matching this exact schema:
{
  "direction": "BUY" | "SELL" | "HOLD" | "WATCH_SELL",
  "confidence_pct": 0-100,
  "entry_usd": number | null,
  "stop_loss_usd": number | null,
  "target_usd": number | null,
  "reasoning": "string",
  "strategy_triggered": "string | null",
  "risk_reward_ratio": number | null
}`

  return { systemMessage, userMessage }
}

export function parseSignalResponse(raw: string): SignalOutput {
  try {
    const parsed = JSON.parse(raw)
    return {
      direction: ['BUY','SELL','HOLD','WATCH_SELL'].includes(parsed.direction)
        ? parsed.direction : 'HOLD',
      confidence_pct: Math.min(100, Math.max(0, Number(parsed.confidence_pct) || 0)),
      entry_usd: parsed.entry_usd ?? null,
      stop_loss_usd: parsed.stop_loss_usd ?? null,
      target_usd: parsed.target_usd ?? null,
      reasoning: String(parsed.reasoning || ''),
      strategy_triggered: parsed.strategy_triggered ?? null,
      risk_reward_ratio: parsed.risk_reward_ratio ?? null,
      raw,
    }
  } catch {
    return {
      direction: 'ERROR',
      confidence_pct: 0,
      entry_usd: null, stop_loss_usd: null, target_usd: null,
      reasoning: 'Failed to parse Claude response — please retry.',
      strategy_triggered: null,
      risk_reward_ratio: null,
      raw,
    }
  }
}

export async function generateSignal(input: SignalInput): Promise<SignalOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'placeholder_wire_in_later') {
    return {
      direction: 'HOLD',
      confidence_pct: 0,
      entry_usd: null, stop_loss_usd: null, target_usd: null,
      reasoning: 'Claude API key not yet configured. Wire in ANTHROPIC_API_KEY to enable signal generation.',
      strategy_triggered: null,
      risk_reward_ratio: null,
      raw: '',
    }
  }

  const { systemMessage, userMessage } = buildSignalPrompt(input)
  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemMessage,
      messages: [{ role: 'user', content: userMessage }],
    })
    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    return parseSignalResponse(raw)
  } catch (err: any) {
    return {
      direction: 'ERROR',
      confidence_pct: 0,
      entry_usd: null, stop_loss_usd: null, target_usd: null,
      reasoning: `Claude API error: ${err.message}`,
      strategy_triggered: null,
      risk_reward_ratio: null,
      raw: '',
    }
  }
}
