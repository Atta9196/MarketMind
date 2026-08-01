import { useEffect, useId, useRef } from 'react'

function InfoIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 11v5" />
      <path strokeLinecap="round" d="M12 8h.01" />
    </svg>
  )
}

export function CalculationInfoButton({ onClick, label = 'How Monte Carlo works' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0f172a]/60 px-2.5 py-1.5 text-xs font-medium text-[#94a3b8] transition hover:border-[#334155] hover:text-white"
      aria-label={label}
    >
      <InfoIcon />
      <span className="hidden sm:inline">How Monte Carlo works</span>
    </button>
  )
}

export default function CalculationInfoModal({ open, onClose }) {
  const titleId = useId()
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1e293b] bg-[#111827] p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-white">
              Monte Carlo Simulation
            </h2>
            <p className="mt-1 text-sm text-[#94a3b8]">
              How MarketMinds estimates a theoretical option price.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#1e293b] px-2.5 py-1 text-sm text-[#94a3b8] transition hover:border-[#334155] hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-3 rounded-xl border border-[#1e293b] bg-[#0f172a]/50 p-4 text-sm">
          <div>
            <p className="font-medium text-white">What it is</p>
            <p className="mt-0.5 text-[#94a3b8]">
              A simulation method that generates many random possible future stock paths, then
              averages the option payoffs.
            </p>
          </div>
          <div>
            <p className="font-medium text-white">How it works</p>
            <p className="mt-0.5 text-[#94a3b8]">
              Each run draws a random path for the stock. The option payoff on that path is
              calculated and discounted back to today. Those results are averaged into one
              theoretical price.
            </p>
          </div>
          <div>
            <p className="font-medium text-white">Why thousands of simulations?</p>
            <p className="mt-0.5 text-[#94a3b8]">
              Thousands of paths are used so the average settles toward a stable estimate instead
              of depending on one lucky or unlucky path.
            </p>
          </div>
          <div>
            <p className="font-medium text-white">Why MarketMinds uses it</p>
            <p className="mt-0.5 text-[#94a3b8]">
              Monte Carlo is the pricing approach shown in the Options Pricing Engine. It supports
              multi-core processing and gives a clear, simulation-based estimate from your inputs
              and live market data.
            </p>
          </div>
        </div>

        <p className="mt-5 text-xs text-[#64748b]">
          All outputs are educational estimates based on model assumptions and market data. They are
          not trading advice.
        </p>
      </div>
    </div>
  )
}
