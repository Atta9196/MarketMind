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
