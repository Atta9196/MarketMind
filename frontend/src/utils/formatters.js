export function formatCurrency(value, { decimals = 2 } = {}) {
  if (value == null || Number.isNaN(value)) {
    return '—'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function getTickerInitials(ticker) {
  return ticker.slice(0, 2).toUpperCase()
}
