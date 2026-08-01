import { TICKER_MAX_LENGTH } from '../constants'

/** Allowed ticker characters (aligned with backend `utils/ticker.py`). */
const TICKER_PATTERN = /^[A-Za-z0-9.\-^=]+$/

export function normalizeTicker(value) {
  return String(value || '').trim().toUpperCase()
}

/**
 * Validate a ticker for client-side forms.
 * @returns {{ ok: true, ticker: string } | { ok: false, message: string }}
 */
export function validateTickerInput(value) {
  const ticker = normalizeTicker(value)

  if (!ticker) {
    return { ok: false, message: 'Ticker symbol is required.' }
  }

  if (ticker.length > TICKER_MAX_LENGTH) {
    return {
      ok: false,
      message: `Ticker must be at most ${TICKER_MAX_LENGTH} characters.`,
    }
  }

  if (!TICKER_PATTERN.test(ticker)) {
    return {
      ok: false,
      message: 'Ticker contains invalid characters. Use letters, numbers, and . - ^ = only.',
    }
  }

  return { ok: true, ticker }
}
