export function getMarketStatus() {
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay()
  const minutes = et.getHours() * 60 + et.getMinutes()
  const isWeekday = day >= 1 && day <= 5
  const isOpen = isWeekday && minutes >= 9 * 60 + 30 && minutes < 16 * 60

  return {
    isOpen,
    label: isOpen ? 'Market Open' : 'Market Closed',
  }
}

export function formatLastUpdated(date) {
  if (!date) {
    return '—'
  }

  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date)

  return `Last updated: ${formatted} ET`
}

export function resolvePriceDirection({
  previousPrice,
  currentPrice,
  dailyChange,
}) {
  if (
    previousPrice !== undefined &&
    previousPrice !== null &&
    currentPrice !== previousPrice
  ) {
    return currentPrice > previousPrice ? 'up' : 'down'
  }

  if (typeof dailyChange === 'number') {
    if (dailyChange > 0) return 'up'
    if (dailyChange < 0) return 'down'
  }

  return 'flat'
}

/** True when a poll returns a different price than the last known value. */
export function didPriceUpdate(previousPrice, currentPrice) {
  return (
    previousPrice !== undefined &&
    previousPrice !== null &&
    typeof currentPrice === 'number' &&
    currentPrice !== previousPrice
  )
}

/** Yahoo Mic codes → display labels used in the UI. */
const EXCHANGE_LABELS = {
  NMS: 'NASDAQ',
  NGM: 'NASDAQ',
  NCM: 'NASDAQ',
  NAS: 'NASDAQ',
  NYQ: 'NYSE',
  PCX: 'NYSE Arca',
  ASE: 'NYSE American',
  BATS: 'Cboe BZX',
}

export function formatExchangeLabel(exchange) {
  if (!exchange) {
    return null
  }

  const key = String(exchange).trim().toUpperCase()
  return EXCHANGE_LABELS[key] || exchange
}

export function formatExchangeSector(exchange, sector) {
  const parts = [formatExchangeLabel(exchange), sector].filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
}

export const PRICE_FLASH_MS = 1600
