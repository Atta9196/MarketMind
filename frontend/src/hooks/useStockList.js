import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchStock } from '../services/stockService'
import { useInterval } from './useInterval'

export function useStockList(
  tickers,
  { enabled = true, refreshInterval = null } = {},
) {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const hasLoadedRef = useRef(false)

  const load = useCallback(
    async (isRefresh = false) => {
      if (!enabled || !tickers.length) {
        setStocks([])
        setConnectionError(false)
        hasLoadedRef.current = false
        return
      }

      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const results = await Promise.allSettled(
        tickers.map((ticker) => fetchStock(ticker)),
      )

      const nextStocks = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)

      const allFailed = results.length > 0 && nextStocks.length === 0
      setConnectionError(allFailed)
      setStocks(nextStocks)
      hasLoadedRef.current = true
      setLoading(false)
      setRefreshing(false)
    },
    [tickers, enabled],
  )

  useEffect(() => {
    hasLoadedRef.current = false
    load(false)
  }, [load])

  useInterval(
    () => {
      if (enabled && tickers.length > 0) {
        load(true)
      }
    },
    enabled && refreshInterval ? refreshInterval : null,
  )

  return {
    stocks,
    loading: loading && !hasLoadedRef.current,
    refreshing,
    connectionError,
    reload: () => load(true),
  }
}
