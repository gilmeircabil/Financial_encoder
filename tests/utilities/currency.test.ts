import { describe, expect, it } from 'vitest'
import {
  formatCurrency,
  formatCompactCurrency,
  toFiniteNumber,
  currencySymbol,
} from '../../src/utils/currency'

describe('formatCurrency', () => {
  it('formats positive numbers with currency', () => {
    expect(formatCurrency(1234.56, 'PHP')).toBe('₱1,234.56')
    expect(formatCurrency(0, 'PHP')).toBe('₱0.00')
  })

  it('formats negative numbers with prefix', () => {
    expect(formatCurrency(-500, 'USD')).toContain('-')
    expect(formatCurrency(-1234.56, 'USD')).toMatch(/^-?\$1,234.56/)
  })

  it('formats compact currency', () => {
    expect(formatCompactCurrency(1234567.89, 'USD')).toMatch(/\$1.2M/)
    // Compact mode shows 0 as "$0" (1 decimal place), not "$0.0"
    expect(formatCompactCurrency(0, 'USD')).toBe('$0')
  })

  it('handles infinity and NaN gracefully', () => {
    expect(formatCurrency(Infinity, 'USD')).toBe('$0.00')
    expect(formatCurrency(NaN, 'USD')).toBe('$0.00')
    // Compact mode: Infinities/default to "$0"
    expect(formatCompactCurrency(Infinity, 'USD')).toBe('$0')
  })
})

describe('toFiniteNumber', () => {
  it('returns the number when it is finite', () => {
    expect(toFiniteNumber(42)).toBe(42)
    expect(toFiniteNumber(0)).toBe(0)
    expect(toFiniteNumber(-3.14)).toBe(-3.14)
  })

  it('defaults invalid values to 0', () => {
    expect(toFiniteNumber(NaN)).toBe(0)
    expect(toFiniteNumber(Infinity)).toBe(0)
    expect(toFiniteNumber(-Infinity)).toBe(0)
    expect(toFiniteNumber(null as any)).toBe(0)
    expect(toFiniteNumber(undefined as any)).toBe(0)
    expect(toFiniteNumber('not-a-number' as any)).toBe(0)
  })
})

describe('currencySymbol', () => {
  it('returns the currency symbol for valid codes', () => {
    expect(currencySymbol('USD')).toBe('$')
    expect(currencySymbol('PHP')).toBe('₱')
    expect(currencySymbol('EUR')).toBe('€')
    expect(currencySymbol('GBP')).toBe('£')
  })

  it('returns the code when Intl fails', () => {
    expect(currencySymbol('XYZ')).toBe('XYZ')
  })

  it('normalizes currency code to uppercase', () => {
    expect(currencySymbol('php')).toBe('₱')
    expect(currencySymbol('usd')).toBe('$')
  })
})