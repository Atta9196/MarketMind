import { formatCurrency } from '../utils/formatters'

/**
 * Live price pill — green border when rising, red when falling.
 * Matches the MarketMinds realtime price badge design.
 */
export default function LivePriceBadge({
  price,
  direction = 'flat',
  size = 'md',
  className = '',
}) {
  const tone =
    direction === 'up' ? 'up' : direction === 'down' ? 'down' : 'flat'

  const sizeClass = size === 'lg' ? 'mm-live-price mm-live-price-lg' : 'mm-live-price'

  return (
    <span
      className={`${sizeClass} mm-live-price-${tone} ${className}`.trim()}
      aria-label={
        direction === 'up'
          ? `Price up to ${formatCurrency(price)}`
          : direction === 'down'
            ? `Price down to ${formatCurrency(price)}`
            : `Price ${formatCurrency(price)}`
      }
    >
      {formatCurrency(price)}
    </span>
  )
}

/**
 * Resolve badge direction from a tick update and/or daily change.
 */
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
