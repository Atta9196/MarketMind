export const WATCHLIST_STORAGE_KEY = 'marketminds_watchlist'
export const WATCHLIST_SEEDED_KEY = 'marketminds_watchlist_seeded_v2'

export const DEFAULT_WATCHLIST = ['AAPL', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META', 'NFLX']

export const NAV_LINKS = [
  { to: '/watchlist', label: 'Watchlist', icon: 'watchlist' },
  { to: '/options', label: 'Options Calc', icon: 'options' },
]

export const DEFAULT_OPTION_TICKER = 'AAPL'
/** Poll interval for live watchlist + stock detail price refresh. */
export const WATCHLIST_REFRESH_INTERVAL_MS = 10_000

/** Matches backend ticker_max_length default. */
export const TICKER_MAX_LENGTH = 10

/** Frontend strike guard (USD). Backend requires gt=0. */
export const STRIKE_MAX = 1_000_000

/** Volatility as percent; backend accepts up to 5.0 (500%). */
export const VOLATILITY_MAX_PERCENT = 500
