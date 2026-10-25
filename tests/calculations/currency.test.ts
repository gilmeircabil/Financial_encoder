import { describe, expect, it } from 'vitest'
import { fmt, currencySymbol } from '../../src/utils/currency'
import { normalizeToIsoCurrency, findCurrencyByCode, CURRENCIES } from '../../src/data/countryCurrency'
import { normalizeCurrencyToIso } from '../../electron/database/settings'

describe('currency module', () => {
  describe('fmt formatter', () => {
    it('formats standard currency with Intl.NumberFormat', () => {
      const formatted = fmt(1234567.89, 'USD')
      expect(formatted).toContain('1,234,567.89')
      expect(formatted).toContain('$')
      expect(formatted).not.toContain('$$')
    })

    it('formats negative numbers consistently with leading minus and no doubled symbols', () => {
      const negative = fmt(-1234, 'USD')
      expect(negative).toBe('-$1,234.00')
      expect(negative).not.toContain('$$')

      const negativePhp = fmt(-500.5, 'PHP')
      expect(negativePhp).toContain('500.50')
      expect(negativePhp.startsWith('-')).toBe(true)
    })

    it('formats compact notation for KPI cards (e.g. $13.4M)', () => {
      const compactPositive = fmt(13_432_352, 'USD', { compact: true })
      expect(compactPositive).toBe('$13.4M')

      const compactNegative = fmt(-16_567_648, 'USD', { compact: true })
      expect(compactNegative).toBe('-$16.6M')

      const compactZero = fmt(0, 'USD', { compact: true })
      expect(compactZero).toBe('$0')
    })

    it('handles edge cases safely without crashing', () => {
      expect(fmt(NaN, 'USD')).toContain('0')
      expect(fmt(Infinity, 'USD')).toContain('0')
      expect(fmt(0, 'UNKNOWN')).toContain('0')
    })
  })

  describe('currencySymbol', () => {
    it('resolves currency symbols dynamically', () => {
      expect(currencySymbol('USD')).toBe('$')
      expect(currencySymbol('PHP')).toBe('₱')
      expect(currencySymbol('EUR')).toBe('€')
      expect(currencySymbol('GBP')).toBe('£')
    })
  })

  describe('currency migration and lookup', () => {
    it('migrates legacy country names like East Timor to ISO code', () => {
      expect(normalizeToIsoCurrency('East Timor')).toBe('USD')
      expect(normalizeToIsoCurrency('United States')).toBe('USD')
      expect(normalizeToIsoCurrency('Philippines')).toBe('PHP')
      expect(normalizeToIsoCurrency('$')).toBe('USD')
      expect(normalizeToIsoCurrency('₱')).toBe('PHP')
      expect(normalizeToIsoCurrency('USD')).toBe('USD')
      expect(normalizeToIsoCurrency('EUR')).toBe('EUR')
      expect(normalizeCurrencyToIso('East Timor')).toBe('USD')
      expect(normalizeCurrencyToIso('philippines')).toBe('PHP')
    })

    it('provides displayName in format "USD – US Dollar"', () => {
      const usd = findCurrencyByCode('USD')
      expect(usd).toBeDefined()
      expect(usd?.displayName).toBe('USD – US Dollar')
      expect(usd?.code).toBe('USD')

      const php = findCurrencyByCode('PHP')
      expect(php).toBeDefined()
      expect(php?.displayName).toBe('PHP – Philippine Peso')
    })

    it('includes East Timor in searchable countries for USD', () => {
      const usd = CURRENCIES.find((c) => c.code === 'USD')
      expect(usd?.countries).toContain('East Timor')
      expect(usd?.countries).toContain('United States')
    })
  })
})
