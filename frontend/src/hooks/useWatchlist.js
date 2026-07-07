import { useCallback, useEffect, useState } from 'react'
import { WATCHLIST_STORAGE_KEY } from '../constants'
import { normalizeTicker } from '../utils/ticker'

function readWatchlist() {
  try {
    const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)
    return Array.isArray(parsed)
      ? [...new Set(parsed.map((item) => normalizeTicker(item)).filter(Boolean))]
      : []
  } catch {
    return []
  }
}

export function useWatchlist() {
  const [tickers, setTickers] = useState(readWatchlist)

  useEffect(() => {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(tickers))
  }, [tickers])

  const resetToDefaults = useCallback((defaults) => {
    setTickers([...new Set(defaults.map((t) => normalizeTicker(t)).filter(Boolean))])
  }, [])

  return {
    tickers,
    resetToDefaults,
  }
}
