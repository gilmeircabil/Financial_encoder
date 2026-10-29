import { formatCurrency, formatCompactCurrency } from '../../utils/currency'
import { Icon } from './Icon'
import type { IconName } from './Icon'

export type KpiCardVariant = 'positive' | 'negative' | 'neutral' | 'ok' | 'warn' | 'danger' | 'capital'

export interface KpiCardProps {
  label: string
  value: number
  currencyCode: string
  variant?: KpiCardVariant
  trend?: number
  trendLabel?: string
  trendString?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  subtitle?: string
  compact?: boolean
  icon?: IconName
  actionLink?: string
  actionAriaLabel?: string
  displayValue?: string
}

export function KpiCard({
  label,
  value,
  currencyCode,
  variant = 'neutral',
  trend,
  trendLabel,
  trendString,
  trendDirection,
  subtitle,
  compact = false,
  icon,
  actionLink,
  actionAriaLabel,
  displayValue,
}: KpiCardProps): React.JSX.Element {
  const shouldCompact = compact || Math.abs(value) >= 1_000_000
  const formattedValue = displayValue ?? (shouldCompact
    ? formatCompactCurrency(value, currencyCode)
    : formatCurrency(value, currencyCode))

  const isPositive = value >= 0

  const valueColorClass = variant === 'positive'
    ? 'stat-card__value--positive'
    : variant === 'negative'
      ? 'stat-card__value--negative'
      : variant === 'capital'
        ? 'stat-card__value--capital'
        : variant === 'neutral'
          ? ''
          : (isPositive ? 'stat-card__value--positive' : 'stat-card__value--negative')

  const effectiveDirection = trendDirection ?? (
    trendString?.startsWith('+') ? 'up' : trendString?.startsWith('-') ? 'down' : 'neutral'
  )

  const prefix = effectiveDirection === 'up'
    ? '↑ '
    : effectiveDirection === 'down'
      ? '↓ '
      : trendString && !trendString.startsWith('—') && !trendString.startsWith('-')
        ? '— '
        : ''

  const variantClass = variant === 'positive' || variant === 'ok'
    ? 'stat-card--income'
    : variant === 'negative' || variant === 'danger'
      ? 'stat-card--expense'
      : variant === 'warn'
        ? 'stat-card--warn'
        : variant === 'capital'
          ? 'stat-card--capital'
          : variant === 'neutral'
            ? 'stat-card--net'
            : (isPositive ? 'stat-card--income' : 'stat-card--expense')

  return (
    <div
      className={`card stat-card ${variantClass}`}
      role="region"
      aria-label={label}
    >
      <div className="stat-card__head">
        <span className="stat-card__label">{label}</span>
        {actionLink && actionAriaLabel ? (
          <a
            href={actionLink}
            className="stat-card__icon stat-card__icon--link"
            title={actionAriaLabel}
            aria-label={actionAriaLabel}
          >
            <Icon name={icon ?? 'arrowUpRight'} size={16} />
          </a>
        ) : icon ? (
          <div className="stat-card__icon" aria-hidden="true">
            <Icon name={icon} size={16} />
          </div>
        ) : null}
      </div>
      <span className={`stat-card__value ${valueColorClass}`.trim()} title={displayValue ?? formatCurrency(value, currencyCode)}>
        {formattedValue}
      </span>
      <div className="stat-card__footer">
        {subtitle && (
          <span className="stat-card__subtitle">{subtitle}</span>
        )}
        <div className="stat-card__trend-row">
          {trendString ? (
            <span className={`stat-card__trend-text stat-card__trend-text--${effectiveDirection}`}>
              {prefix}{trendString}
            </span>
          ) : trend !== undefined ? (
            <span className={`stat-card__badge ${trend >= 0 ? 'stat-card__badge--ok' : 'stat-card__badge--danger'}`}>
              <span>{trend >= 0 ? '+' : ''}{(trend * 100).toFixed(1)}%</span>
            </span>
          ) : null}
          {trendLabel && (
            <span className="stat-card__subtext">{trendLabel}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default KpiCard