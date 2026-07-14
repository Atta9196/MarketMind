import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchStock } from '../services/stockService'
import { useInterval } from './useInterval'
import { resolvePriceDirection } from '../components/LivePriceBadge'

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
  const [priceDirection, setPriceDirection] = useState('flat')
  const previousPriceRef = useRef(undefined)

  const load = useCallback(
    async (isRefresh = false) => {
      if (!ticker || !enabled) {
        return
      }

      if (!isRefresh) {
        setLoading(true)
        setError(null)
      }

      try {
        const stock = await fetchStock(ticker, { period, interval })

        setPriceDirection(
          resolvePriceDirection({
            previousPrice: previousPriceRef.current,
            currentPrice: stock.price,
            dailyChange: stock.daily_change,
          }),
        )
        previousPriceRef.current = stock.price
        setData(stock)
        setError(null)
      } catch (err) {
        if (!isRefresh) {
          setData(null)
          setPriceDirection('flat')
          previousPriceRef.current = undefined
        }
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [ticker, enabled, period, interval],
  )

  useEffect(() => {
    previousPriceRef.current = undefined
    setPriceDirection('flat')
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

  return { data, loading, error, priceDirection, reload: () => load(false) }
}
