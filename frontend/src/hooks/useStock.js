import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchStock } from '../services/stockService'
import { useInterval } from './useInterval'

export function useStock(
  ticker,
  {
    enabled = true,
    period = null,
    interval = null,
    refreshInterval = null,
  } = {},
) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  const load = useCallback(
    async (isRefresh = false) => {
      if (!ticker || !enabled) {
        return
      }

      const requestId = ++requestIdRef.current

      if (!isRefresh) {
        setLoading(true)
        setError(null)
      }

      try {
        const stock = await fetchStock(ticker, { period, interval })
        if (requestId !== requestIdRef.current) {
          return
        }
        setData(stock)
        setError(null)
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return
        }
        if (!isRefresh) {
          setData(null)
        }
        setError(err.message)
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [ticker, enabled, period, interval],
  )

  useEffect(() => {
    setData(null)
    load(false)
  }, [load])

  useInterval(
    () => {
      if (enabled && ticker) {
        load(true)
      }
    },
    enabled && refreshInterval ? refreshInterval : null,
  )

  return { data, loading, error, reload: () => load(false) }
}
