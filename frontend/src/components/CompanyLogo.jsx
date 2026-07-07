import { getTickerInitials } from '../utils/formatters'

const FIGMA_SVG_TICKERS = new Set([
  'AAPL',
  'NVDA',
  'AMZN',
  'GOOGL',
  'TSLA',
  'META',
  'NFLX',
])

export default function CompanyLogo({ ticker, size = 40 }) {
  const normalized = ticker?.toUpperCase() || ''
  const logoTicker = normalized === 'GOOG' ? 'GOOGL' : normalized

  if (FIGMA_SVG_TICKERS.has(logoTicker)) {
    return (
      <img
        src={`/logos/${logoTicker}.svg`}
        alt=""
        width={size}
        height={size}
        className="shrink-0 object-contain"
        draggable={false}
      />
    )
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[10px] text-xs font-bold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: '#3b82f6',
      }}
      aria-hidden="true"
    >
      {getTickerInitials(normalized)}
    </div>
  )
}
