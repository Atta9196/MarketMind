import { formatCurrency } from '../utils/formatters'

/**
 * Live price chip — flashes green when a refreshed price arrives,
 * then returns to the quiet standard state (Figma realtime design).
 */
export default function LivePriceBadge({
  price,
  flashing = false,
  size = 'md',
  className = '',
}) {
  const sizeClass = size === 'lg' ? 'mm-live-price mm-live-price-lg' : 'mm-live-price'
  const toneClass = flashing ? 'mm-live-price-flash' : 'mm-live-price-idle'

  return (
    <span
      className={`${sizeClass} ${toneClass} ${className}`.trim()}
      aria-label={
        flashing
          ? `Updated price ${formatCurrency(price)}`
          : `Price ${formatCurrency(price)}`
      }
    >
      {formatCurrency(price)}
    </span>
  )
}
