import yahooFinance from 'yahoo-finance2'

export interface Quote {
  ticker: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
}

export interface HistoricalBar {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjClose: number
}

export async function getLiveQuote(ticker: string): Promise<Quote> {
  const result = await yahooFinance.quote(ticker)
  return {
    ticker,
    price: result.regularMarketPrice ?? 0,
    change: result.regularMarketChange ?? 0,
    changePercent: result.regularMarketChangePercent ?? 0,
    volume: result.regularMarketVolume ?? 0,
    marketCap: result.marketCap,
  }
}

export async function getLiveQuotes(tickers: string[]): Promise<Quote[]> {
  return Promise.all(tickers.map(getLiveQuote))
}

export async function getHistorical(
  ticker: string,
  from: Date,
  to: Date = new Date()
): Promise<HistoricalBar[]> {
  const results = await yahooFinance.historical(ticker, {
    period1: from.toISOString().split('T')[0],
    period2: to.toISOString().split('T')[0],
    interval: '1d',
  })
  return results.map(r => ({
    date: r.date,
    open: r.open ?? 0,
    high: r.high ?? 0,
    low: r.low ?? 0,
    close: r.close ?? 0,
    volume: r.volume ?? 0,
    adjClose: r.adjClose ?? r.close ?? 0,
  }))
}

export async function getFundamentals(ticker: string) {
  const summary = await yahooFinance.quoteSummary(ticker, {
    modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData'],
  })
  return {
    peRatio: summary.summaryDetail?.trailingPE ?? null,
    eps: summary.defaultKeyStatistics?.trailingEps ?? null,
    revenueGrowth: summary.financialData?.revenueGrowth ?? null,
    marketCap: summary.summaryDetail?.marketCap ?? null,
  }
}
