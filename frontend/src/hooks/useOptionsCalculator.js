import { useCallback, useState } from 'react'
import { calculateOptions } from '../services/optionsService'
import { normalizeTicker } from '../utils/ticker'

function daysUntilExpiration(expirationDate) {
  const expiry = new Date(`${expirationDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffMs = expiry.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function defaultExpirationDate() {
  const date = new Date()
  date.setMonth(date.getMonth() + 6)
  return date.toISOString().slice(0, 10)
}

function validateInputs({ ticker, strikePrice, riskFreeRate, volatility, expirationDate }) {
  const errors = {}

  if (!normalizeTicker(ticker)) {
    errors.ticker = 'Ticker symbol is required.'
  }

  const strike = Number(strikePrice)
  if (!strikePrice || Number.isNaN(strike) || strike <= 0) {
    errors.strikePrice = 'Strike price must be greater than 0.'
  }

  const rate = Number(riskFreeRate)
  if (riskFreeRate === '' || Number.isNaN(rate) || rate < 0 || rate > 100) {
    errors.riskFreeRate = 'Risk-free rate must be between 0 and 100.'
  }

  const vol = Number(volatility)
  if (volatility === '' || Number.isNaN(vol) || vol <= 0 || vol > 500) {
    errors.volatility = 'Volatility must be greater than 0.'
  }

  if (!expirationDate) {
    errors.expirationDate = 'Expiration date is required.'
  } else {
    const days = daysUntilExpiration(expirationDate)
    if (days <= 0) {
      errors.expirationDate = 'Expiration date must be in the future.'
    }
  }

  return errors
}

export function useOptionsCalculator() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [hasCalculated, setHasCalculated] = useState(false)

  const calculate = useCallback(async (inputs) => {
    const validationErrors = validateInputs(inputs)
    setFieldErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setError('Please enter valid parameters to perform calculations.')
      setResult(null)
      setHasCalculated(true)
      return null
    }

    setLoading(true)
    setError(null)
    setHasCalculated(true)

    try {
      const days = daysUntilExpiration(inputs.expirationDate)
      const response = await calculateOptions({
        ticker: normalizeTicker(inputs.ticker),
        strike_price: Number(inputs.strikePrice),
        risk_free_rate: Number(inputs.riskFreeRate) / 100,
        volatility: Number(inputs.volatility) / 100,
        time_to_expiration_days: days,
        option_type: inputs.optionType || 'call',
      })

      setResult(response)
      return response
    } catch (err) {
      setResult(null)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clearFieldError = useCallback((field) => {
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
  }, [])

  return {
    result,
    loading,
    error,
    fieldErrors,
    hasCalculated,
    calculate,
    clearFieldError,
    defaultExpirationDate,
  }
}
