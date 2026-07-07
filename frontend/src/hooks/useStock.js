import { useCallback, useEffect, useState } from 'react'
import { fetchStock } from '../services/stockService'

export function useStock(ticker, { enabled = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!ticker || !enabled) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const stock = await fetchStock(ticker)
      setData(stock)
    } catch (err) {
      setData(null)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [ticker, enabled])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}
