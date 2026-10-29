import { describe, expect, it } from 'vitest'
import {
  cashPosition,
  computeFinance,
  computeFinanceFromTransactions,
  marginRate,
  netEquity,
  netProfit,
} from '../../src/lib/finance'

describe('finance module', () => {
  describe('pure calculation functions', () => {
    it('calculates netProfit as income - expenses (capital is NOT profit)', () => {
      expect(netProfit(33_455_584, 20_023_232)).toBe(13_432_352)
      expect(netProfit(0, 500)).toBe(-500)
      expect(netProfit(1000, 0)).toBe(1000)
    })

    it('calculates cashPosition as totalIncome + capitalAdded - totalExpenses - totalWithdrawals', () => {
      expect(cashPosition(33_455_584, 5_343_455, 20_023_232, 0)).toBe(18_775_807)
      expect(cashPosition(1000, 500, 300, 200)).toBe(1000)
    })

    it('calculates netEquity as capitalAdded - totalWithdrawals', () => {
      expect(netEquity(5_343_455, 0)).toBe(5_343_455)
      expect(netEquity(5000, 2000)).toBe(3000)
      expect(netEquity(1000, 3000)).toBe(-2000)
    })

    it('calculates marginRate without divide-by-zero on zero or negative income', () => {
      expect(marginRate(13_432_352, 33_455_584)).toBeCloseTo(0.401498, 5)
      expect(Number((marginRate(13_432_352, 33_455_584) * 100).toFixed(1))).toBe(40.1)

      expect(marginRate(500, 0)).toBe(0)
      expect(marginRate(0, 0)).toBe(0)
      expect(marginRate(-200, 0)).toBe(0)
      expect(marginRate(100, -1000)).toBe(0)
    })
  })

  describe('sample verification data', () => {
    it('matches required sample verification numbers exactly', () => {
      const sample = {
        income: 33_455_584,
        expense: 20_023_232,
        capital: 5_343_455,
        withdrawal: 0,
      }

      const result = computeFinance(sample)

      expect(result.netProfit).toBe(13_432_352)
      expect(result.cashPosition).toBe(18_775_807)
      expect(Number((result.marginRate * 100).toFixed(1))).toBe(40.1)
      expect(result.netEquity).toBe(5_343_455)
    })
  })

  describe('edge cases', () => {
    it('handles empty dataset gracefully (defaults to 0)', () => {
      const emptyObj = computeFinance({})
      expect(emptyObj).toEqual({
        totalIncome: 0,
        totalExpenses: 0,
        capitalAdded: 0,
        totalWithdrawals: 0,
        netProfit: 0,
        cashPosition: 0,
        netEquity: 0,
        marginRate: 0,
      })

      const nullResult = computeFinance(null)
      expect(nullResult).toEqual({
        totalIncome: 0,
        totalExpenses: 0,
        capitalAdded: 0,
        totalWithdrawals: 0,
        netProfit: 0,
        cashPosition: 0,
        netEquity: 0,
        marginRate: 0,
      })
    })

    it('handles negative profit when expenses exceed income', () => {
      const result = computeFinance({
        income: 10_000,
        expense: 15_000,
        capital: 2_000,
        withdrawal: 500,
      })

      expect(result.netProfit).toBe(-5_000)
      expect(result.cashPosition).toBe(-3_500)
      expect(result.netEquity).toBe(1_500)
      expect(result.marginRate).toBe(-0.5)
    })

    it('handles withdrawals > 0 and withdrawals > capital', () => {
      const result = computeFinance({
        income: 5_000,
        expense: 2_000,
        capital: 1_000,
        withdrawal: 3_000,
      })

      expect(result.netProfit).toBe(3_000)
      expect(result.cashPosition).toBe(1_000)
      expect(result.netEquity).toBe(-2_000)
      expect(result.marginRate).toBe(0.6)
    })

    it('computes metrics correctly from raw transaction list', () => {
      const txs = [
        { type: 'income', amount: 33_455_584 },
        { type: 'expense', amount: 20_023_232 },
        { type: 'capital', amount: 5_343_455 },
        { type: 'withdrawal', amount: 0 },
      ]

      const result = computeFinanceFromTransactions(txs)
      expect(result.netProfit).toBe(13_432_352)
      expect(result.cashPosition).toBe(18_775_807)
      expect(Number((result.marginRate * 100).toFixed(1))).toBe(40.1)
    })

    it('reconciles user real-world figures: ₱20K revenue, ₱23.278M expense, -₱23.258M net loss', () => {
      const userNumbers = {
        income: 20_000,
        expense: 23_278_097,
        capital: 0,
        withdrawal: 0,
      }
      const metrics = computeFinance(userNumbers)
      expect(metrics.totalIncome).toBe(20_000)
      expect(metrics.totalExpenses).toBe(23_278_097)
      expect(metrics.netProfit).toBe(-23_258_097)
      expect(metrics.cashPosition).toBe(-23_258_097)
      expect(metrics.netEquity).toBe(0)
      expect(metrics.marginRate).toBe(-23_258_097 / 20_000)
    })

    it('verifies that assets and liabilities are excluded from operating income and expenses', () => {
      const txsWithBalanceSheet = [
        { type: 'income', amount: 20_000 },
        { type: 'expense', amount: 5_000 },
        { type: 'asset', amount: 50_000 },
        { type: 'liability', amount: 30_000 },
      ]
      const metrics = computeFinanceFromTransactions(txsWithBalanceSheet)
      // Operating net profit must remain only income - expenses
      expect(metrics.totalIncome).toBe(20_000)
      expect(metrics.totalExpenses).toBe(5_000)
      expect(metrics.netProfit).toBe(15_000)
      // Operating margin must only use income & expense
      expect(metrics.marginRate).toBe(0.75)
    })
  })
})
