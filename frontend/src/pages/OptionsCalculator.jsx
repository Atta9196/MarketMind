import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_OPTION_TICKER } from '../constants'
import { useOptionsCalculator } from '../hooks/useOptionsCalculator'
import OptionsProcessingPanel from '../components/OptionsProcessingPanel'
import { CpuScalingIcon } from '../components/CpuChipIcon'

const MONTE_CARLO_SIMULATIONS = 100_000

function CalculatorIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 4h6m-6 4h3M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
    </svg>
  )
}

function RefreshIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3b82f6]">
      {children}
    </p>
  )
}

function FieldHint({ children }) {
  return <p className="mt-1.5 text-xs text-[#64748b]">{children}</p>
}

function formatErrorDetails(error, ticker) {
  const symbol = (ticker || 'AAPL').trim().toUpperCase() || 'AAPL'
  const connectionMessage = `Unable to retrieve market data from ${symbol}. Please check your connection and try again.`

  if (!error) {
    return connectionMessage
  }

  const normalized = error.toLowerCase()

  // Keep validation copy as-is inside Error Details
  if (
    normalized.includes('valid parameters') ||
    normalized.includes('required') ||
    normalized.includes('must be') ||
    normalized.includes('greater than') ||
    normalized.includes('between')
  ) {
    return error
  }

  if (
    normalized.includes('network') ||
    normalized.includes('fetch') ||
    normalized.includes('unavailable') ||
    normalized.includes('retrieve') ||
    normalized.includes('not found') ||
    normalized.includes('timeout') ||
    normalized.includes('timed out') ||
    normalized.includes('connection') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('500') ||
    normalized.includes('408') ||
    normalized.includes('404')
  ) {
    return connectionMessage
  }

  return connectionMessage
}

function formatStatusLabel(status) {
  switch (status) {
    case 'ITM':
      return 'In the Money (ITM)'
    case 'OTM':
      return 'Out of the Money (OTM)'
    case 'Knocked Out':
      return 'Knocked Out'
    default:
      return status
  }
}

export default function OptionsCalculator() {
  const [searchParams] = useSearchParams()
  const {
    result,
    loading,
    error,
    fieldErrors,
    hasCalculated,
    calculate,
    clearFieldError,
    defaultExpirationDate,
  } = useOptionsCalculator()

  const [ticker, setTicker] = useState(
    searchParams.get('ticker')?.toUpperCase() || DEFAULT_OPTION_TICKER,
  )
  const [strikePrice, setStrikePrice] = useState('150.00')
  const [optionType, setOptionType] = useState('call')
  const [expirationDate, setExpirationDate] = useState(defaultExpirationDate)
  const [riskFreeRate, setRiskFreeRate] = useState('4.25')
  const [volatility, setVolatility] = useState('22.45')

  useEffect(() => {
    const queryTicker = searchParams.get('ticker')
    if (queryTicker) {
      setTicker(queryTicker.toUpperCase())
    }
  }, [searchParams])

  const hasResult = Boolean(result && !error)
  const showError = hasCalculated && !loading && !hasResult
  const cpuCores = useMemo(
    () => Math.min(typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4, 4),
    [],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    await calculate({
      ticker,
      strikePrice,
      riskFreeRate,
      volatility,
      expirationDate,
      optionType,
    })
  }

  const handleRecalculate = async () => {
    await calculate({
      ticker,
      strikePrice,
      riskFreeRate,
      volatility,
      expirationDate,
      optionType,
    })
  }

  const computationTime = hasResult
    ? `${Math.max(result.binomial_meta.time_seconds, 0.001).toFixed(3)}s`
    : '--'

  const resultRows = hasResult
    ? [
        ['Model Used', 'Monte Carlo'],
        ['Simulations', MONTE_CARLO_SIMULATIONS.toLocaleString()],
        ['CPU Cores Used', String(cpuCores)],
        ['Computation Time', computationTime],
        ['Volatility (Annualized)', `${(result.volatility * 100).toFixed(2)}%`],
      ]
    : [
        ['Model Used', '--'],
        ['Simulations', '--'],
        ['CPU Cores Used', '--'],
        ['Computation Time', '--'],
        ['Volatility (Annualized)', '--'],
      ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-white sm:text-[1.75rem]">
        Options Pricing Engine
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-[#94a3b8]">
        Enter options parameters below to calculate the theoretical price using our
        multi-core pricing engine
      </p>

      <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <div className="mm-options-card p-4 sm:p-6 lg:col-span-2 xl:col-span-1">
          <SectionLabel>1. INPUT PARAMETERS</SectionLabel>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mm-options-label">Ticker Symbol</label>
              <input
                type="text"
                value={ticker}
                onChange={(event) => {
                  setTicker(event.target.value.toUpperCase())
                  clearFieldError('ticker')
                }}
                className="mm-input"
              />
              <FieldHint>e.g., AAPL, MSFT, NVDA</FieldHint>
              {fieldErrors.ticker ? (
                <p className="mt-1 text-xs text-[#ef4444]">{fieldErrors.ticker}</p>
              ) : null}
            </div>

            <div>
              <label className="mm-options-label">Strike Price (USD)</label>
              <input
                type="number"
                step="0.01"
                value={strikePrice}
                onChange={(event) => {
                  setStrikePrice(event.target.value)
                  clearFieldError('strikePrice')
                }}
                className="mm-input"
              />
              <FieldHint>e.g., 150.00</FieldHint>
              {fieldErrors.strikePrice ? (
                <p className="mt-1 text-xs text-[#ef4444]">{fieldErrors.strikePrice}</p>
              ) : null}
            </div>

            <div>
              <label className="mm-options-label">Option Type</label>
              <select
                value={optionType}
                onChange={(event) => setOptionType(event.target.value)}
                className="mm-input"
              >
                <option value="call">Call</option>
                <option value="put">Put</option>
              </select>
            </div>

            <div>
              <label className="mm-options-label">Expiration Date</label>
              <div className="mm-date-field">
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(event) => {
                    setExpirationDate(event.target.value)
                    clearFieldError('expirationDate')
                  }}
                  className="mm-input mm-date-input"
                />
                <svg
                  className="mm-date-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {fieldErrors.expirationDate ? (
                <p className="mt-1 text-xs text-[#ef4444]">{fieldErrors.expirationDate}</p>
              ) : null}
            </div>

            <div>
              <label className="mm-options-label">Risk-Free Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={riskFreeRate}
                onChange={(event) => {
                  setRiskFreeRate(event.target.value)
                  clearFieldError('riskFreeRate')
                }}
                className="mm-input"
              />
              {fieldErrors.riskFreeRate ? (
                <p className="mt-1 text-xs text-[#ef4444]">{fieldErrors.riskFreeRate}</p>
              ) : null}
            </div>

            <div>
              <label className="mm-options-label">Volatility (%)</label>
              <input
                type="number"
                step="0.01"
                value={volatility}
                onChange={(event) => {
                  setVolatility(event.target.value)
                  clearFieldError('volatility')
                }}
                className="mm-input"
              />
              <FieldHint>e.g., 22.34</FieldHint>
              {fieldErrors.volatility ? (
                <p className="mt-1 text-xs text-[#ef4444]">{fieldErrors.volatility}</p>
              ) : null}
            </div>

            <button type="submit" className="mm-btn-primary mt-2 w-full gap-2" disabled={loading}>
              <CalculatorIcon />
              {loading ? 'Calculating...' : 'Calculate'}
            </button>
          </form>
        </div>

        <div className="mm-options-card flex min-h-0 flex-col p-4 sm:min-h-[480px] sm:p-6 xl:min-h-[560px]">
          <SectionLabel>2. PROCESSING</SectionLabel>
          <div className="flex flex-1 flex-col items-center justify-center">
            {showError ? (
              <div className="mm-calc-failed w-full text-center">
                <div className="mm-calc-failed-icon" aria-hidden="true">
                  <svg viewBox="0 0 64 64" fill="none" className="h-full w-full">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="#ef4444"
                      strokeWidth="3.5"
                    />
                    <path
                      d="M32 18v18"
                      stroke="#ef4444"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                    <circle cx="32" cy="46" r="3.25" fill="#ef4444" />
                  </svg>
                </div>
                <p className="mt-5 text-lg font-semibold text-white">
                  Calculation Failed
                </p>
                <p className="mt-2 text-sm text-[#94a3b8]">
                  We encountered an error while trying to calculate the option
                  price.
                </p>
                <div className="mm-calc-failed-details mt-6 text-left">
                  <p className="text-sm font-semibold text-[#ef4444]">
                    Error Details
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#e2e8f0]">
                    {formatErrorDetails(error, ticker)}
                  </p>
                </div>
              </div>
            ) : (
              <OptionsProcessingPanel loading={loading} complete={hasResult} />
            )}
          </div>
        </div>

        <div className="mm-options-card flex min-h-0 flex-col p-4 sm:min-h-[480px] sm:p-6 xl:min-h-[560px]">
          <SectionLabel>2. RESULTS</SectionLabel>
          <div className="flex flex-1 flex-col">
            <p className="text-sm font-medium text-[#94a3b8]">
              Theoretical Option Price
            </p>
            <p
              className={`mt-3 text-4xl font-bold tracking-tight sm:text-5xl ${
                hasResult ? 'text-[#22c55e]' : 'text-white'
              }`}
            >
              {hasResult ? `$${result.primary_price.toFixed(2)}` : '--'}
            </p>

            {showError ? (
              <span className="mm-status-badge failed mt-4">
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-[#ef4444]"
                  aria-hidden="true"
                />
                Calculation Failed
              </span>
            ) : hasResult ? (
              <span className="mm-status-badge success mt-4">
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-[#22c55e]"
                  aria-hidden="true"
                />
                {formatStatusLabel(result.status)}
              </span>
            ) : null}

            <div className="mt-6 space-y-3 border-t border-[#1e293b] pt-4">
              {resultRows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[#64748b]">{label}</span>
                  <span className="font-medium text-white">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6">
              {showError ? (
                <button
                  type="button"
                  className="mm-btn-recalculate w-full"
                  onClick={handleRecalculate}
                  disabled={loading}
                >
                  <RefreshIcon className="h-4 w-4" />
                  Recalculate
                </button>
              ) : hasResult ? (
                <button
                  type="button"
                  className="mm-btn-recalculate mm-btn-recalculate-blue w-full"
                  onClick={handleRecalculate}
                  disabled={loading}
                >
                  <RefreshIcon className="h-4 w-4" />
                  Recalculate
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-[#64748b] sm:mt-8 sm:gap-x-8 sm:text-sm">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Secure Computation
        </div>
        <div className="flex items-center gap-2">
          <CpuScalingIcon className="h-4 w-4 shrink-0" />
          High-Scaling Computing
        </div>
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          Bank-grade security
        </div>
      </div>

      <div className="mm-disclaimer mt-5 sm:mt-6">
        <svg className="h-4 w-4 shrink-0 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="text-left text-xs text-[#94a3b8] sm:text-center sm:text-sm">
          All calculations are estimates based on real-time market data and model assumptions.
        </p>
      </div>
    </div>
  )
}
