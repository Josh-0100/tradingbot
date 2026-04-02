import { createClient } from '@/lib/supabase/server'
import { getLiveQuote } from '@/lib/data/yahoo'
import { getGbpUsdRate, convertUsdToGbp } from '@/lib/data/exchange-rate'

interface PnlInput { quantity: number; avgBuyPriceGbp: number; currentPriceGbp: number }
export function calculatePnl({ quantity, avgBuyPriceGbp, currentPriceGbp }: PnlInput): number {
  return Math.round((currentPriceGbp - avgBuyPriceGbp) * quantity * 100) / 100
}

interface PositionSizeInput { balanceGbp: number; riskPercent: number; priceGbp: number }
export function calculatePositionSize({ balanceGbp, riskPercent, priceGbp }: PositionSizeInput): number {
  const riskAmount = balanceGbp * (riskPercent / 100)
  return Math.max(1, Math.floor(riskAmount / priceGbp))
}

export async function executePaperTrade({
  userId,
  ticker,
  direction,
  quantity,
  signalId,
}: {
  userId: string
  ticker: string
  direction: 'BUY' | 'SELL'
  quantity: number
  signalId?: string
}) {
  const supabase = await createClient()

  const { data: portfolio, error: portErr } = await supabase
    .from('paper_portfolio')
    .select('id, gbp_balance')
    .eq('user_id', userId)
    .single()
  if (portErr || !portfolio) throw new Error('Portfolio not found')

  const [quote, rate] = await Promise.all([getLiveQuote(ticker), getGbpUsdRate()])
  const priceUsd = quote.price
  const priceGbp = convertUsdToGbp(priceUsd, rate)
  const totalCost = priceGbp * quantity

  if (direction === 'BUY') {
    if (portfolio.gbp_balance < totalCost) throw new Error('Insufficient balance')

    await supabase.from('paper_positions').insert({
      portfolio_id: portfolio.id,
      ticker,
      quantity,
      avg_buy_price_gbp: priceGbp,
      signal_id: signalId ?? null,
    })

    await supabase.from('paper_portfolio')
      .update({ gbp_balance: portfolio.gbp_balance - totalCost })
      .eq('id', portfolio.id)

    await supabase.from('paper_trades').insert({
      portfolio_id: portfolio.id, ticker,
      direction: 'BUY', quantity,
      price_usd: priceUsd, price_gbp: priceGbp,
      signal_id: signalId ?? null,
    })
  } else {
    const { data: position } = await supabase
      .from('paper_positions')
      .select('id, quantity, avg_buy_price_gbp')
      .eq('portfolio_id', portfolio.id)
      .eq('ticker', ticker)
      .single()
    if (!position) throw new Error('No open position for ' + ticker)

    const pnl = calculatePnl({
      quantity,
      avgBuyPriceGbp: position.avg_buy_price_gbp,
      currentPriceGbp: priceGbp,
    })

    await supabase.from('paper_positions').delete().eq('id', position.id)

    await supabase.from('paper_portfolio')
      .update({ gbp_balance: portfolio.gbp_balance + totalCost })
      .eq('id', portfolio.id)

    await supabase.from('paper_trades').insert({
      portfolio_id: portfolio.id, ticker,
      direction: 'SELL', quantity,
      price_usd: priceUsd, price_gbp: priceGbp,
      pnl_gbp: pnl,
      signal_id: signalId ?? null,
    })
  }

  return { priceGbp, priceUsd, rate }
}
