-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Stocks / ticker reference
create table stocks (
  id uuid primary key default uuid_generate_v4(),
  ticker text unique not null,
  name text,
  sector text,
  market_cap bigint,
  asset_class text not null default 'equity',
  is_in_watchlist boolean not null default false,
  created_at timestamptz default now()
);

-- Raw OHLCV price history
create table price_data (
  id uuid primary key default uuid_generate_v4(),
  ticker text not null,
  date date not null,
  open numeric, high numeric, low numeric,
  close numeric not null, volume bigint, adj_close numeric,
  unique(ticker, date)
);
create index price_data_ticker_date on price_data(ticker, date desc);

-- Nightly pre-calculated indicators (no VWAP — intraday only)
create table indicators (
  id uuid primary key default uuid_generate_v4(),
  ticker text not null,
  date date not null,
  timeframe text not null default '1D',
  rsi_14 numeric,
  macd_line numeric, macd_signal numeric, macd_hist numeric,
  sma_20 numeric, sma_50 numeric, sma_200 numeric,
  ema_12 numeric, ema_26 numeric,
  bb_upper numeric, bb_mid numeric, bb_lower numeric,
  atr_14 numeric,
  stoch_k numeric, stoch_d numeric,
  obv numeric,
  unique(ticker, date, timeframe)
);

-- Claude-generated signals
create table signals (
  id uuid primary key default uuid_generate_v4(),
  ticker text not null,
  created_at timestamptz default now(),
  direction text not null,
  confidence_pct integer,
  entry_price_usd numeric, entry_price_gbp numeric,
  stop_loss_usd numeric, stop_loss_gbp numeric,
  target_usd numeric, target_gbp numeric,
  risk_reward_ratio numeric,
  reasoning text,
  strategy_triggered text,
  indicators_snapshot jsonb,
  raw_claude_response jsonb
);

-- News with sentiment
create table news_items (
  id uuid primary key default uuid_generate_v4(),
  ticker text,
  headline text not null,
  source text,
  url text,
  published_at timestamptz,
  sentiment_score numeric,
  fetched_at timestamptz default now()
);

-- Strategy rules
create table strategies (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  rules jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Paper trading
create table paper_portfolio (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  gbp_balance numeric not null default 10000,
  created_at timestamptz default now()
);

create table paper_positions (
  id uuid primary key default uuid_generate_v4(),
  portfolio_id uuid references paper_portfolio not null,
  ticker text not null,
  quantity numeric not null,
  avg_buy_price_gbp numeric not null,
  opened_at timestamptz default now(),
  signal_id uuid references signals
);

create table paper_trades (
  id uuid primary key default uuid_generate_v4(),
  portfolio_id uuid references paper_portfolio not null,
  ticker text not null,
  direction text not null,
  quantity numeric not null,
  price_usd numeric, price_gbp numeric not null,
  executed_at timestamptz default now(),
  signal_id uuid references signals,
  pnl_gbp numeric
);

-- Daily briefings
create table daily_briefings (
  id uuid primary key default uuid_generate_v4(),
  date date unique not null,
  content text not null,
  generated_at timestamptz default now()
);

-- RSS feeds
create table rss_feeds (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  url text unique not null,
  poll_interval_minutes integer default 120,
  last_fetched_at timestamptz,
  is_active boolean default true
);

-- GBP/USD exchange rate cache
create table exchange_rates (
  id uuid primary key default uuid_generate_v4(),
  pair text not null default 'GBPUSD',
  rate numeric not null,
  fetched_at timestamptz default now()
);

-- Row Level Security
alter table stocks enable row level security;
alter table price_data enable row level security;
alter table indicators enable row level security;
alter table signals enable row level security;
alter table news_items enable row level security;
alter table strategies enable row level security;
alter table paper_portfolio enable row level security;
alter table paper_positions enable row level security;
alter table paper_trades enable row level security;
alter table daily_briefings enable row level security;
alter table rss_feeds enable row level security;
alter table exchange_rates enable row level security;

-- Policies: authenticated read on reference tables
create policy "auth read stocks" on stocks for select to authenticated using (true);
create policy "auth read price_data" on price_data for select to authenticated using (true);
create policy "auth read indicators" on indicators for select to authenticated using (true);
create policy "auth read signals" on signals for select to authenticated using (true);
create policy "auth read news" on news_items for select to authenticated using (true);
create policy "auth read strategies" on strategies for select to authenticated using (true);
create policy "auth read briefings" on daily_briefings for select to authenticated using (true);
create policy "auth read exchange_rates" on exchange_rates for select to authenticated using (true);
create policy "auth read rss_feeds" on rss_feeds for select to authenticated using (true);

-- Signals: server-side insert (service role bypasses RLS)
create policy "auth insert signals" on signals for insert to authenticated with check (true);

-- Paper portfolio: scoped to owner
create policy "own portfolio" on paper_portfolio for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own positions" on paper_positions for all to authenticated
  using (portfolio_id in (select id from paper_portfolio where user_id = auth.uid()));
create policy "own trades" on paper_trades for all to authenticated
  using (portfolio_id in (select id from paper_portfolio where user_id = auth.uid()));
