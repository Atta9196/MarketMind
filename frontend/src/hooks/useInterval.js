import { useEffect, useRef } from 'react'

export function useInterval(callback, delay) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay == null) {
      return undefined
    }

    const tick = () => savedCallback.current()
    const intervalId = window.setInterval(tick, delay)

    return () => window.clearInterval(intervalId)
  }, [delay])
}
