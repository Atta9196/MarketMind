import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStock } from '../hooks/useStock'
import { formatCurrency } from '../utils/formatters'
import { normalizeTicker } from '../utils/ticker'
import { formatLastUpdated, getMarketStatus } from '../utils/market'
import CompanyLogo from '../components/CompanyLogo'
import StockDetailChart from '../charts/StockDetailChart'
import LoadingSpinner from '../components/LoadingSpinner'

function formatExchangeSector(exchange, sector) {
  const parts = [exchange, sector].filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
}

export default function StockDetail() {
  const { ticker = '' } = useParams()
  const { data, loading, error, reload } = useStock(ticker)
  const normalizedTicker = normalizeTicker(ticker)
  const [lastUpdated, setLastUpdated] = useState(null)
  const marketStatus = getMarketStatus()

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

  return (
    <div>
      <Link
        to="/watchlist"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#3b82f6] transition hover:text-[#60a5fa]"
      >
        <span aria-hidden="true">←</span> Back to Watchlist
      </Link>

      <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <CompanyLogo ticker={data.ticker} size={48} />
          <div>
            <p className="text-2xl font-bold text-white">{data.ticker}</p>
            <p className="mt-0.5 text-base font-medium text-white">
              {data.company_name?.replace(/\.$/, '') || data.ticker}
            </p>
            <p className="mt-1 text-sm text-[#64748b]">
              {formatExchangeSector(data.company?.exchange, data.company?.sector)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <p className="text-3xl font-bold text-white">{formatCurrency(data.price)}</p>
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

      <div className="rounded-2xl border border-[#1e293b] bg-[#0f172a]/40 px-4 py-6 sm:px-6">
        <StockDetailChart history={data.history} />
      </div>

      <p className="mt-6 text-center text-xs text-[#64748b]">
        All times are Eastern Time (ET) · Data provided by Yahoo Finance
      </p>
    </div>
  )
}
