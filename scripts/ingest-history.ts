import { createClient } from '@supabase/supabase-js'
import { getHistorical } from '../lib/data/yahoo'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const TICKERS = [
  'AAPL','MSFT','NVDA','AMZN','META','GOOGL','GOOG','BRK-B','LLY','TSLA',
  'UNH','XOM','JPM','V','MA','PG','AVGO','HD','CVX','MRK',
  'COST','ABBV','PEP','KO','ADBE','WMT','MCD','CSCO','ACN','BAC',
  'CRM','TMO','ABT','LIN','DHR','NFLX','NKE','TXN','CMCSA','ORCL',
  'NEE','VZ','UPS','QCOM','PM','RTX','BMY','AMGN','HON','LOW','SPY'
]

const FROM_DATE = new Date('2005-01-01')
const BATCH_SIZE = 5

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function ingestTicker(ticker: string) {
  console.log(`Fetching ${ticker}...`)
  try {
    const bars = await getHistorical(ticker, FROM_DATE)
    if (!bars.length) { console.log(`  No data for ${ticker}`); return }

    await supabase.from('stocks').upsert(
      { ticker, asset_class: 'equity', is_in_watchlist: false },
      { onConflict: 'ticker' }
    )

    for (let i = 0; i < bars.length; i += 500) {
      const chunk = bars.slice(i, i + 500).map(b => ({
        ticker,
        date: b.date.toISOString().split('T')[0],
        open: b.open, high: b.high, low: b.low,
        close: b.close, volume: b.volume, adj_close: b.adjClose,
      }))
      const { error } = await supabase.from('price_data')
        .upsert(chunk, { onConflict: 'ticker,date' })
      if (error) console.error(`  Error upserting ${ticker} chunk:`, error.message)
    }

    console.log(`  ✓ ${ticker}: ${bars.length} bars`)
  } catch (err: any) {
    console.error(`  ✗ ${ticker}:`, err.message)
  }
}

async function main() {
  console.log(`Starting ingestion of ${TICKERS.length} tickers from ${FROM_DATE.toDateString()}`)
  for (let i = 0; i < TICKERS.length; i += BATCH_SIZE) {
    const batch = TICKERS.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(ingestTicker))
  }

  // Mark watchlist tickers
  const watchlist = ['AAPL','MSFT','NVDA','TSLA','AMZN','META','GOOGL','JPM','SPY']
  await supabase.from('stocks').update({ is_in_watchlist: true }).in('ticker', watchlist)
  console.log(`Marked ${watchlist.length} watchlist tickers.`)
  console.log('Ingestion complete.')
}

main().catch(console.error)
