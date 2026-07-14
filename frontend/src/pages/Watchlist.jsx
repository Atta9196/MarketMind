import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DEFAULT_WATCHLIST,
  WATCHLIST_REFRESH_INTERVAL_MS,
  WATCHLIST_SEEDED_KEY,
} from '../constants'
import { useWatchlist } from '../hooks/useWatchlist'
import { useStockList } from '../hooks/useStockList'
import { formatLastUpdated, getMarketStatus } from '../utils/market'
import CompanyLogo from '../components/CompanyLogo'
import LivePriceBadge, { resolvePriceDirection } from '../components/LivePriceBadge'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Watchlist() {
  const navigate = useNavigate()
  const { tickers, resetToDefaults } = useWatchlist()
  const [lastUpdated, setLastUpdated] = useState(null)
  const [priceDirections, setPriceDirections] = useState({})
  const prevPricesRef = useRef({})
  const marketStatus = getMarketStatus()

  const { stocks, loading, refreshing, connectionError, reload } = useStockList(tickers, {
    enabled: tickers.length > 0,
    refreshInterval: WATCHLIST_REFRESH_INTERVAL_MS,
  })

  useEffect(() => {
    if (!localStorage.getItem(WATCHLIST_SEEDED_KEY)) {
      resetToDefaults(DEFAULT_WATCHLIST)
      localStorage.setItem(WATCHLIST_SEEDED_KEY, 'true')
    }
  }, [resetToDefaults])

  useEffect(() => {
    if (!stocks.length) {
      return
    }

    setLastUpdated(new Date())

    const nextDirections = {}
    stocks.forEach((stock) => {
      const previous = prevPricesRef.current[stock.ticker]
      nextDirections[stock.ticker] = resolvePriceDirection({
        previousPrice: previous,
        currentPrice: stock.price,
        dailyChange: stock.daily_change,
      })
      prevPricesRef.current[stock.ticker] = stock.price
    })

    setPriceDirections((current) => ({ ...current, ...nextDirections }))
  }, [stocks])

  const rows = useMemo(
    () =>
      tickers.map((ticker) => ({
        ticker,
        stock: stocks.find((item) => item.ticker === ticker),
      })),
    [tickers, stocks],
  )

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight text-white sm:text-[1.75rem]">
            Live Watchlist
          </h1>
          <p className="mt-1 text-sm text-[#94a3b8]">
            Real-time market data from Yahoo Finance
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-2">
          <div className="flex flex-col gap-1 sm:items-end">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  marketStatus.isOpen ? 'bg-[#22c55e]' : 'bg-[#94a3b8]'
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-sm font-medium ${
                  marketStatus.isOpen ? 'text-[#22c55e]' : 'text-[#94a3b8]'
                }`}
              >
                {marketStatus.label}
              </span>
            </div>
            <p className="text-xs text-[#64748b]">{formatLastUpdated(lastUpdated)}</p>
          </div>
          <button
            type="button"
            onClick={reload}
            disabled={refreshing}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1e293b] bg-[#0f172a] text-[#94a3b8] transition hover:border-[#334155] hover:text-white disabled:opacity-50"
            aria-label="Refresh watchlist"
          >
            <svg
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {connectionError && !loading ? (
          <div className="flex flex-col items-center justify-center px-2 py-12 text-center sm:py-16">
            <svg
              className="mb-4 h-14 w-14 text-[#64748b] sm:h-16 sm:w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3l18 18"
              />
            </svg>
            <p className="text-lg font-semibold text-white">No Connection</p>
            <p className="mt-2 max-w-sm text-sm text-[#94a3b8]">
              Unable to reach the MarketMinds server. Check that the backend is
              running and try again.
            </p>
            <button
              type="button"
              className="mm-btn-primary mt-6"
              onClick={reload}
              disabled={refreshing}
            >
              Retry
            </button>
          </div>
        ) : (
        <table className="w-full min-w-[280px] text-left">
          <thead>
            <tr className="border-b border-[#1e293b]">
              <th className="pb-3 pr-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b] sm:pr-4">
                Symbol
              </th>
              <th className="hidden pb-3 pr-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b] sm:table-cell">
                Company
              </th>
              <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && stocks.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-16">
                  <LoadingSpinner label="Loading watchlist..." size="sm" />
                </td>
              </tr>
            ) : (
              rows.map(({ ticker, stock }) => {
                const direction = priceDirections[ticker] || 'flat'

                return (
                  <tr
                    key={ticker}
                    onClick={() => stock && navigate(`/stock/${ticker}`)}
                    className="cursor-pointer border-b border-[#1e293b] transition last:border-b-0 hover:bg-[#0f172a]/50"
                  >
                    <td className="py-3.5 pr-3 sm:py-4 sm:pr-4">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <span className="shrink-0 sm:hidden">
                          <CompanyLogo ticker={ticker} size={36} />
                        </span>
                        <span className="hidden shrink-0 sm:inline-flex">
                          <CompanyLogo ticker={ticker} size={40} />
                        </span>
                        <div className="min-w-0">
                          <span className="block text-sm font-bold text-white">{ticker}</span>
                          <span className="mt-0.5 block truncate text-xs text-[#94a3b8] sm:hidden">
                            {stock?.company_name || '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden py-4 pr-4 text-sm text-[#94a3b8] sm:table-cell">
                      {stock?.company_name || '—'}
                    </td>
                    <td className="py-3.5 text-right sm:py-4">
                      {stock ? (
                        <LivePriceBadge
                          price={stock.price}
                          direction={direction}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        )}
      </div>

      {!connectionError && (
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-[#64748b] sm:mt-10 sm:gap-6">
        <div className="flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded border border-[#22c55e] bg-[#22c55e]/10 shadow-[0_0_8px_rgba(34,197,94,0.25)]"
            aria-hidden="true"
          />
          <span>Price up</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded border border-[#ef4444] bg-[#ef4444]/10 shadow-[0_0_8px_rgba(239,68,68,0.25)]"
            aria-hidden="true"
          />
          <span>Price down</span>
        </div>
      </div>
      )}
    </div>
  )
}
