/**
 * Currency formatting utilities for Financial Encoder (Acorn).
 * Built on native Intl.NumberFormat with zero manual symbol concatenation.
 */

export interface FmtOptions {
  compact?: boolean
}

/**
 * Primary currency formatter built on Intl.NumberFormat.
 * Supports compact notation and formats negative numbers consistently (e.g. -$1,234.00).
 */
export const fmt = (
  n: number,
  currency: string,
  { compact = false }: FmtOptions = {},
): string => {
  const safe = Number.isFinite(n) ? n : 0
  const code = (currency || 'USD').toUpperCase().trim()
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 2,
    }).format(safe)
  } catch {
    const sign = safe < 0 ? '-' : ''
    const abs = Math.abs(safe)
    return `${sign}${code} ${abs.toLocaleString(undefined, {
      minimumFractionDigits: compact ? 0 : 2,
      maximumFractionDigits: compact ? 1 : 2,
    })}`
  }
}

/** Coerces a possibly invalid value into a finite number (defaults to 0). */
export function toFiniteNumber(value: number): number {
  return Number.isFinite(value) ? value : 0
}

/** Symbol for a currency code, resolved dynamically using Intl.NumberFormat. */
export function currencySymbol(code: string): string {
  const normalized = (code || 'USD').toUpperCase().trim()
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: normalized,
    }).formatToParts(1)
    const symbolPart = parts.find((p) => p.type === 'currency')
    return symbolPart?.value ?? normalized
  } catch {
    return normalized
  }
}

/** Formats an amount using standard currency rules with 2 decimal places. */
export function formatCurrency(amount: number, currencyCode: string): string {
  return fmt(amount, currencyCode, { compact: false })
}

/** Formats currency with compact notation (e.g. $13.4M). */
export function formatCompactCurrency(amount: number, currencyCode: string): string {
  return fmt(amount, currencyCode, { compact: true })
}

/** Formats integer currency or standard display for stat cards. */
export function formatIntegerCurrency(amount: number, currencyCode: string): string {
  return fmt(amount, currencyCode, { compact: false })
}
