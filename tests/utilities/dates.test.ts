import { describe, expect, it } from 'vitest'
import {
  formatDate,
  parseISODate,
  todayFormatted,
  toISODate,
} from '../../src/utils/dates'

describe('dates module', () => {
  describe('formatDate', () => {
    it('formats with YYYY token', () => {
      const date = new Date(2024, 0, 15)
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15')
    })

    it('formats with MMM token (short month)', () => {
      const date = new Date(2024, 0, 15)
      const result = formatDate(date, 'MMM DD, YYYY')
      expect(result).toContain('Jan')
      expect(result).toContain('15')
      expect(result).toContain('2024')
    })

    it('formats with MMMM token (long month)', () => {
      const date = new Date(2024, 0, 15)
      const result = formatDate(date, 'MMMM DD, YYYY')
      expect(result).toContain('January')
    })

    it('formats with DD token (padded day)', () => {
      const date = new Date(2024, 0, 5)
      expect(formatDate(date, 'DD/MM/YYYY')).toBe('05/01/2024')
    })

    it('formats with D token (unpadded day)', () => {
      const date = new Date(2024, 0, 5)
      expect(formatDate(date, 'D/M/YYYY')).toBe('5/1/2024')
    })

    it('handles leap year', () => {
      const date = new Date(2024, 1, 29)
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-02-29')
    })

    it('handles year boundaries', () => {
      const date = new Date(2024, 11, 31)
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-12-31')
    })

    it('preserves unrecognized tokens', () => {
      const date = new Date(2024, 0, 15)
      expect(formatDate(date, 'YYYY-QQ')).toBe('2024-QQ')
    })
  })

  describe('parseISODate', () => {
    it('parses YYYY-MM-DD format', () => {
      const date = parseISODate('2024-01-15')
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(15)
      expect(date.getHours()).toBe(12)
    })

    it('parses month boundaries', () => {
      const jan = parseISODate('2024-01-01')
      expect(jan.getMonth()).toBe(0)
      expect(jan.getDate()).toBe(1)

      const dec = parseISODate('2024-12-31')
      expect(dec.getMonth()).toBe(11)
      expect(dec.getDate()).toBe(31)
    })

    it('handles invalid month/day gracefully (JS Date rolls over)', () => {
      const date = parseISODate('2024-13-45')
      // JS Date rolls 13 months into next year
      expect(date.getFullYear()).toBe(2025)
    })

    it('handles empty parts with defaults', () => {
      const date = parseISODate('2024--')
      expect(date.getFullYear()).toBe(2024)
    })
  })

  describe('todayFormatted', () => {
    it('formats current date with provided format', () => {
      const result = todayFormatted('YYYY-MM-DD')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('formats with different format', () => {
      const result = todayFormatted('DD/MM/YYYY')
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    })
  })

  describe('toISODate', () => {
    it('converts Date to YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15, 10, 30, 0)
      expect(toISODate(date)).toBe('2024-01-15')
    })

    it('handles month padding', () => {
      const date = new Date(2024, 0, 5)
      expect(toISODate(date)).toBe('2024-01-05')
    })

    it('handles day padding', () => {
      const date = new Date(2024, 11, 3)
      expect(toISODate(date)).toBe('2024-12-03')
    })
  })
})