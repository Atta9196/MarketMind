import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DEFAULT_WATCHLIST,
  WATCHLIST_REFRESH_INTERVAL_MS,
  WATCHLIST_SEEDED_KEY,
} from '../constants'
import { useWatchlist } from '../hooks/useWatchlist'
import { useStockList } from '../hooks/useStockList'
import { formatCurrency } from '../utils/formatters'
import { formatLastUpdated, getMarketStatus } from '../utils/market'
import CompanyLogo from '../components/CompanyLogo'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Watchlist() {
  const navigate = useNavigate()
  const { tickers, resetToDefaults } = useWatchlist()
  const [lastUpdated, setLastUpdated] = useState(null)
  const [flashedTickers, setFlashedTickers] = useState(() => new Set())
  const prevPricesRef = useRef({})
  const marketStatus = getMarketStatus()

  const { stocks, loading, refreshing, reload } = useStockList(tickers, {
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

    const updated = new Set()
    stocks.forEach((stock) => {
      const previous = prevPricesRef.current[stock.ticker]
      if (previous !== undefined && previous !== stock.price) {
        updated.add(stock.ticker)
      }
      prevPricesRef.current[stock.ticker] = stock.price
    })

    if (updated.size === 0) {
      return
    }

    setFlashedTickers(updated)
    const timeout = window.setTimeout(() => setFlashedTickers(new Set()), 2500)
    return () => window.clearTimeout(timeout)
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
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[1.75rem] font-bold leading-tight text-white">
            Live Watchlist
          </h1>
          <p className="mt-1 text-sm text-[#94a3b8]">
            Real-time market data from Yahoo Finance
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
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
          <button
            type="button"
            onClick={reload}
            disabled={refreshing}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1e293b] bg-[#0f172a] text-[#94a3b8] transition hover:border-[#334155] hover:text-white disabled:opacity-50"
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

      <div className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1e293b]">
              <th className="pb-3 pr-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                Symbol
              </th>
              <th className="pb-3 pr-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
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
                const isFlashing = flashedTickers.has(ticker)

                return (
                  <tr
                    key={ticker}
                    onClick={() => stock && navigate(`/stock/${ticker}`)}
                    className="cursor-pointer border-b border-[#1e293b] transition last:border-b-0 hover:bg-[#0f172a]/50"
                  >
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <CompanyLogo ticker={ticker} size={40} />
                        <span className="text-sm font-bold text-white">{ticker}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-sm text-[#94a3b8]">
                      {stock?.company_name || '—'}
                    </td>
                    <td className="py-4 text-right">
                      {stock ? (
                        <span
                          className={`inline-block text-sm font-semibold text-white ${
                            isFlashing ? 'mm-price-flash' : ''
                          }`}
                        >
                          {formatCurrency(stock.price)}
                        </span>
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
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#64748b]">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded border border-[#475569]" aria-hidden="true" />
          <span>Standard state</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded border border-[#22c55e]/60 bg-[#22c55e]/10 shadow-[0_0_8px_rgba(34,197,94,0.25)]"
            aria-hidden="true"
          />
          <span>Update flash (price just updated)</span>
        </div>
      </div>
    </div>
  )
}
