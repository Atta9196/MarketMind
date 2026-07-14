import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { WATCHLIST_REFRESH_INTERVAL_MS } from '../constants'
import { useStock } from '../hooks/useStock'
import { usePriceFlash } from '../hooks/usePriceFlash'
import { normalizeTicker } from '../utils/ticker'
import {
  formatExchangeSector,
  formatLastUpdated,
  getMarketStatus,
} from '../utils/market'
import CompanyLogo from '../components/CompanyLogo'
import LivePriceBadge from '../components/LivePriceBadge'
import StockDetailChart from '../charts/StockDetailChart'
import LoadingSpinner from '../components/LoadingSpinner'

export default function StockDetail() {
  const { ticker = '' } = useParams()
  const { data, loading, error, reload } = useStock(ticker, {
    period: '5d',
    interval: '15m',
    refreshInterval: WATCHLIST_REFRESH_INTERVAL_MS,
  })
  const normalizedTicker = normalizeTicker(ticker)
  const [lastUpdated, setLastUpdated] = useState(null)
  const marketStatus = getMarketStatus()
  const priceFlashing = usePriceFlash(data?.price)

  useEffect(() => {
    if (data) {
      setLastUpdated(new Date())
    }
  }, [data])

  if (loading) {
    return <LoadingSpinner label={`Loading ${normalizedTicker}...`} />
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/watchlist" className="text-sm font-medium text-[#3b82f6] hover:text-[#60a5fa]">
          ← Back to Watchlist
        </Link>
        <p className="text-[#ef4444]">{error}</p>
        <button type="button" className="mm-btn-primary" onClick={reload}>
          Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const companyName = data.company_name?.replace(/\.$/, '') || data.ticker

  return (
    <div>
      <Link
        to="/watchlist"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#3b82f6] transition hover:text-[#60a5fa] sm:mb-6"
      >
        <span aria-hidden="true">←</span> Back to Watchlist
      </Link>

      <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <CompanyLogo ticker={data.ticker} size={44} />
          <div className="min-w-0">
            <p className="text-xl font-bold text-white sm:text-2xl">{data.ticker}</p>
            <p className="mt-0.5 truncate text-sm font-medium text-[#94a3b8] sm:text-base">
              {companyName}
            </p>
            <p className="mt-1 text-xs text-[#64748b] sm:text-sm">
              {formatExchangeSector(data.company?.exchange, data.company?.sector)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <LivePriceBadge
            price={data.price}
            flashing={priceFlashing}
            size="lg"
          />
          <div className="flex flex-wrap items-center gap-3">
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
        </div>
      </div>

      <div className="rounded-xl border border-[#1e293b] bg-[#0b1220] px-2 py-4 sm:rounded-2xl sm:px-5 sm:py-6">
        <StockDetailChart history={data.history} />
      </div>

      <p className="mt-5 px-1 text-center text-[11px] leading-relaxed text-[#64748b] sm:mt-6 sm:text-xs">
        All times are Eastern Time (ET) · Data provided by Yahoo Finance
      </p>
    </div>
  )
}
