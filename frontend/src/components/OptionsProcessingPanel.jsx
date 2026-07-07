import { useEffect, useState } from 'react'
import { CpuChipIcon } from './CpuChipIcon'

function CoreDots({ count }) {
  if (count === 1) {
    return (
      <div className="flex h-8 w-8 items-center justify-center">
        <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="flex h-8 w-8 items-center justify-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className="flex h-8 w-8 flex-col items-center justify-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid h-8 w-8 grid-cols-2 grid-rows-2 gap-1">
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
      ))}
    </div>
  )
}

export default function OptionsProcessingPanel({ loading, complete }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!loading) {
      if (complete) {
        setProgress(100)
      } else if (!complete) {
        setProgress(0)
      }
      return undefined
    }

    setProgress(8)
    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) {
          return current
        }
        return Math.min(current + 4 + Math.random() * 6, 92)
      })
    }, 180)

    return () => window.clearInterval(interval)
  }, [loading, complete])

  const displayProgress = complete ? 100 : Math.round(progress)
  const ringOffset = 283 - (283 * displayProgress) / 100

  if (!loading && !complete) {
    return (
      <p className="text-sm text-[#64748b]">
        Enter parameters and click Calculate to begin processing.
      </p>
    )
  }

  return (
    <div className="flex w-full flex-col items-center text-center">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg className="absolute inset-0 h-28 w-28 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="283"
            strokeDashoffset={ringOffset}
            className="transition-[stroke-dashoffset] duration-300"
          />
        </svg>
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#0f172a] text-white">
          <CpuChipIcon className="h-10 w-10" />
        </div>
      </div>

      <p className="mt-6 text-base font-semibold text-white">
        {complete ? 'Calculation Complete' : 'Distributing to CPU Cores...'}
      </p>
      <p className="mt-2 max-w-xs text-sm text-[#94a3b8]">
        {complete
          ? 'Monte Carlo simulation finished using multi-core processing.'
          : 'Running Monte Carlo simulation using multi-core processing.'}
      </p>

      <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-2 rounded-lg border border-[#1e293b] bg-[#0f172a]/80 px-3 py-3"
          >
            <CoreDots count={index + 1} />
            <span className="text-xs text-[#64748b]">Core {index + 1}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 w-full">
        <div className="h-2.5 overflow-hidden rounded-full bg-[#1e293b]">
          <div
            className="h-full rounded-full bg-[#3b82f6] transition-all duration-300"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-[#94a3b8]">{displayProgress}% Complete</p>
      </div>
    </div>
  )
}
