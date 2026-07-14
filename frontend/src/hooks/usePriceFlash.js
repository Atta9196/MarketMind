import { useEffect, useRef, useState } from 'react'
import { PRICE_FLASH_MS, didPriceUpdate } from '../utils/market'

/**
 * Tracks which tickers should show the Figma "update flash" after a price change.
 * Flash clears automatically after PRICE_FLASH_MS.
 */
export function usePriceFlashMap(stocks) {
  const [flashing, setFlashing] = useState({})
  const prevPricesRef = useRef({})
  const timersRef = useRef({})

  useEffect(() => {
    if (!stocks?.length) {
      return
    }

    const activated = []

    stocks.forEach((stock) => {
      const previous = prevPricesRef.current[stock.ticker]
      if (didPriceUpdate(previous, stock.price)) {
        activated.push(stock.ticker)
      }
      prevPricesRef.current[stock.ticker] = stock.price
    })

    if (!activated.length) {
      return
    }

    setFlashing((current) => {
      const next = { ...current }
      activated.forEach((ticker) => {
        next[ticker] = true
      })
      return next
    })

    activated.forEach((ticker) => {
      if (timersRef.current[ticker]) {
        clearTimeout(timersRef.current[ticker])
      }
      timersRef.current[ticker] = setTimeout(() => {
        setFlashing((current) => {
          if (!current[ticker]) {
            return current
          }
          const next = { ...current }
          delete next[ticker]
          return next
        })
        delete timersRef.current[ticker]
      }, PRICE_FLASH_MS)
    })
  }, [stocks])

  useEffect(
    () => () => {
      Object.values(timersRef.current).forEach((timer) => clearTimeout(timer))
      timersRef.current = {}
    },
    [],
  )

  return flashing
}

/** Single-ticker flash for stock detail. */
export function usePriceFlash(price) {
  const [flashing, setFlashing] = useState(false)
  const prevPriceRef = useRef(undefined)
  const timerRef = useRef(null)

  useEffect(() => {
    const previous = prevPriceRef.current
    prevPriceRef.current = price

    if (!didPriceUpdate(previous, price)) {
      return undefined
    }

    setFlashing(true)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      setFlashing(false)
      timerRef.current = null
    }, PRICE_FLASH_MS)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [price])

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    },
    [],
  )

  return flashing
}
