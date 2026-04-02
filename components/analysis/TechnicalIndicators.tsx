interface IndicatorSnapshot {
  rsi_14?: number | null
  macd_line?: number | null
  macd_signal?: number | null
  sma_50?: number | null
  sma_200?: number | null
  ema_12?: number | null
  ema_26?: number | null
  bb_upper?: number | null
  bb_mid?: number | null
  bb_lower?: number | null
  atr_14?: number | null
  obv?: number | null
}

function fmt(v: number | null | undefined): string {
  return v != null ? v.toFixed(2) : 'N/A'
}

export function TechnicalIndicators({ data }: { data: IndicatorSnapshot }) {
  const macdBull = data.macd_line != null && data.macd_signal != null && data.macd_line > data.macd_signal
  const goldCross = data.sma_50 != null && data.sma_200 != null && data.sma_50 > data.sma_200

  return (
    <div className="bg-gray-900 rounded-lg p-4 text-sm">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Technical Indicators</p>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-1.5">MOMENTUM</p>
          <Row label="RSI (14)" value={fmt(data.rsi_14)} note={data.rsi_14 != null ? (data.rsi_14 < 30 ? 'Oversold' : data.rsi_14 > 70 ? 'Overbought' : 'Neutral') : ''} />
          <Row label="MACD" value={fmt(data.macd_line)} note={macdBull ? 'Bullish cross' : 'Bearish / flat'} colour={macdBull ? 'green' : undefined} />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1.5">TREND</p>
          <Row label="SMA 50 / 200" value={`${fmt(data.sma_50)} / ${fmt(data.sma_200)}`} note={goldCross ? 'Golden cross' : 'No cross'} colour={goldCross ? 'green' : undefined} />
          <Row label="EMA 12 / 26" value={`${fmt(data.ema_12)} / ${fmt(data.ema_26)}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1.5">VOLATILITY & VOLUME</p>
          <Row label="BB Upper / Lower" value={`${fmt(data.bb_upper)} / ${fmt(data.bb_lower)}`} />
          <Row label="ATR (14)" value={fmt(data.atr_14)} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, note, colour }: { label: string; value: string; note?: string; colour?: string }) {
  return (
    <div className="flex justify-between text-xs py-1 border-b border-gray-800">
      <span className="text-gray-400">{label}</span>
      <span>
        <strong className="text-white">{value}</strong>
        {note && <span className={`ml-2 ${colour === 'green' ? 'text-green-400' : 'text-gray-500'}`}>{note}</span>}
      </span>
    </div>
  )
}
