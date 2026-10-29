import { describe, expect, it } from 'vitest'
import {
  periodRange,
  cashFlowGranularity,
  dateSpanDays,
  customRangeInvalid,
  formatMonth,
  startOfMonth,
  endOfMonth,
  PERIOD_KEYS,
  PERIOD_LABELS,
} from '../../src/utils/periods'

describe('periods module', () => {
  describe('startOfMonth', () => {
    it('returns first day of month in YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15)
      expect(startOfMonth(date)).toBe('2024-01-01')
    })

    it('handles December', () => {
      const date = new Date(2024, 11, 25)
      expect(startOfMonth(date)).toBe('2024-12-01')
    })
  })

  describe('endOfMonth', () => {
    it('returns last day of month in YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15)
      expect(endOfMonth(date)).toBe('2024-01-31')
    })

    it('handles February in leap year', () => {
      const date = new Date(2024, 1, 15)
      expect(endOfMonth(date)).toBe('2024-02-29')
    })

    it('handles February in non-leap year', () => {
      const date = new Date(2023, 1, 15)
      expect(endOfMonth(date)).toBe('2023-02-28')
    })
  })

  describe('formatMonth', () => {
    it('formats YYYY-MM to MMM YYYY', () => {
      expect(formatMonth('2024-01')).toBe('Jan 2024')
      expect(formatMonth('2024-12')).toBe('Dec 2024')
    })

    it('handles single digit months', () => {
      expect(formatMonth('2024-01')).toBe('Jan 2024')
      expect(formatMonth('2024-09')).toBe('Sep 2024')
    })
  })

  describe('dateSpanDays', () => {
    it('calculates days between two dates', () => {
      expect(dateSpanDays('2024-01-01', '2024-01-10')).toBe(9)
    })

    it('handles cross-month span', () => {
      expect(dateSpanDays('2024-01-28', '2024-02-03')).toBe(6)
    })

    it('handles cross-year span', () => {
      expect(dateSpanDays('2023-12-30', '2024-01-02')).toBe(3)
    })

    it('returns 0 for same date', () => {
      expect(dateSpanDays('2024-01-15', '2024-01-15')).toBe(0)
    })

    it('handles leap year', () => {
      expect(dateSpanDays('2024-02-28', '2024-03-01')).toBe(2)
    })
  })

  describe('customRangeInvalid', () => {
    it('returns true when from > to', () => {
      expect(customRangeInvalid('2024-01-15', '2024-01-10')).toBe(true)
    })

    it('returns false when from <= to', () => {
      expect(customRangeInvalid('2024-01-10', '2024-01-15')).toBe(false)
      expect(customRangeInvalid('2024-01-15', '2024-01-15')).toBe(false)
    })

    it('returns false when either is empty', () => {
      expect(customRangeInvalid('', '2024-01-15')).toBe(false)
      expect(customRangeInvalid('2024-01-15', '')).toBe(false)
      expect(customRangeInvalid('', '')).toBe(false)
    })
  })

  describe('cashFlowGranularity', () => {
    it('returns day for spans <= 31 days', () => {
      expect(cashFlowGranularity({ date_from: '2024-01-01', date_to: '2024-01-15' })).toBe('day')
      expect(cashFlowGranularity({ date_from: '2024-01-01', date_to: '2024-01-31' })).toBe('day')
    })

    it('returns week for spans 32-120 days', () => {
      expect(cashFlowGranularity({ date_from: '2024-01-01', date_to: '2024-02-15' })).toBe('week')
      expect(cashFlowGranularity({ date_from: '2024-01-01', date_to: '2024-04-30' })).toBe('week')
    })

    it('returns month for spans > 120 days', () => {
      expect(cashFlowGranularity({ date_from: '2024-01-01', date_to: '2024-06-15' })).toBe('month')
      expect(cashFlowGranularity({ date_from: '2024-01-01', date_to: '2024-12-31' })).toBe('month')
    })

    it('returns month when bounds missing', () => {
      expect(cashFlowGranularity({})).toBe('month')
      expect(cashFlowGranularity({ date_from: '2024-01-01' })).toBe('month')
      expect(cashFlowGranularity({ date_to: '2024-12-31' })).toBe('month')
    })
  })

  describe('periodRange', () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    it('this-month returns start of month to today', () => {
      const range = periodRange('this-month', '', '')
      expect(range.date_from).toBe(`${year}-${String(month).padStart(2, '0')}-01`)
      expect(range.date_to).toBeDefined()
    })

    it('last-3-months returns 3 months ago to today', () => {
      const range = periodRange('last-3-months', '', '')
      expect(range.date_from).toBeDefined()
      expect(range.date_to).toBeDefined()
    })

    it('this-year returns Jan 1 to today', () => {
      const range = periodRange('this-year', '', '')
      expect(range.date_from).toBe(`${year}-01-01`)
      expect(range.date_to).toBeDefined()
    })

    it('all returns empty bounds', () => {
      const range = periodRange('all', '', '')
      expect(range).toEqual({})
    })

    it('custom returns provided bounds', () => {
      const range = periodRange('custom', '2024-01-01', '2024-06-30')
      expect(range.date_from).toBe('2024-01-01')
      expect(range.date_to).toBe('2024-06-30')
    })

    it('custom returns partial bounds when only one provided', () => {
      const range = periodRange('custom', '2024-01-01', '')
      expect(range.date_from).toBe('2024-01-01')
      expect(range.date_to).toBeUndefined()

      const range2 = periodRange('custom', '', '2024-06-30')
      expect(range2.date_from).toBeUndefined()
      expect(range2.date_to).toBe('2024-06-30')
    })
  })

  describe('PERIOD_KEYS and PERIOD_LABELS', () => {
    it('PERIOD_KEYS contains expected keys', () => {
      expect(PERIOD_KEYS).toEqual(['this-month', 'last-3-months', 'this-year', 'all'])
    })

    it('PERIOD_LABELS has labels for each key', () => {
      expect(PERIOD_LABELS['this-month']).toBe('This Month')
      expect(PERIOD_LABELS['last-3-months']).toBe('Last 3 Months')
      expect(PERIOD_LABELS['this-year']).toBe('This Year')
      expect(PERIOD_LABELS['all']).toBe('All Time')
    })
  })
})