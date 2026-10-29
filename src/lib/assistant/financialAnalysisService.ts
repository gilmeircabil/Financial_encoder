import { api } from '../../services/api'
import type {
  CalculationFilter,
  CalculationTotals,
  CategoryBreakdown,
  MonthlySummary,
  Transaction,
} from '../../../electron/types/ipc'

export interface MonthPeriod {
  start: string
  end: string
  label: string
  year: number
  month: number
  daysInMonth: number
}

export interface MonthComparisonResult {
  currentMonth: MonthPeriod
  previousMonth: MonthPeriod
  currentTotals: CalculationTotals
  previousTotals: CalculationTotals
  incomeDiff: number
  incomePct: number | null
  expenseDiff: number
  expensePct: number | null
  netDiff: number
  netPct: number | null
  cashFlowDiff: number
  cashFlowPct: number | null
}

export interface CategoryComparisonRow {
  categoryId: number
  categoryName: string
  currentAmount: number
  previousAmount: number
  diff: number
  pctChange: number | null
}

/**
 * Computes calendar month bounds cleanly without external date libraries.
 */
export function getMonthPeriod(date: Date): MonthPeriod {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const pad = (n: number) => String(n).padStart(2, '0')
  const start = `${year}-${pad(month + 1)}-01`
  const end = `${year}-${pad(month + 1)}-${pad(daysInMonth)}`

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const label = `${monthNames[month]} ${year}`

  return { start, end, label, year, month: month + 1, daysInMonth }
}

export function getPreviousMonthPeriod(date: Date): MonthPeriod {
  const prevDate = new Date(date.getFullYear(), date.getMonth() - 1, 1)
  return getMonthPeriod(prevDate)
}

export function safePercentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1))
}

export class FinancialAnalysisService {
  constructor(private apiService = api) {}

  async getCurrentMonthTotals(referenceDate: Date = new Date()): Promise<{ period: MonthPeriod; totals: CalculationTotals }> {
    const period = getMonthPeriod(referenceDate)
    const totals = await this.apiService.calculations.totals({
      date_from: period.start,
      date_to: period.end,
    })
    return { period, totals }
  }

  async compareMonthWithPrevious(referenceDate: Date = new Date()): Promise<MonthComparisonResult> {
    const currentMonth = getMonthPeriod(referenceDate)
    const previousMonth = getPreviousMonthPeriod(referenceDate)

    const [currentTotals, previousTotals] = await Promise.all([
      this.apiService.calculations.totals({ date_from: currentMonth.start, date_to: currentMonth.end }),
      this.apiService.calculations.totals({ date_from: previousMonth.start, date_to: previousMonth.end }),
    ])

    const incomeDiff = currentTotals.income - previousTotals.income
    const incomePct = safePercentChange(currentTotals.income, previousTotals.income)

    const expenseDiff = currentTotals.expense - previousTotals.expense
    const expensePct = safePercentChange(currentTotals.expense, previousTotals.expense)

    const currentNet = currentTotals.income - currentTotals.expense
    const prevNet = previousTotals.income - previousTotals.expense
    const netDiff = currentNet - prevNet
    const netPct = safePercentChange(currentNet, prevNet)

    const currentCashFlow = currentTotals.net
    const prevCashFlow = previousTotals.net
    const cashFlowDiff = currentCashFlow - prevCashFlow
    const cashFlowPct = safePercentChange(currentCashFlow, prevCashFlow)

    return {
      currentMonth,
      previousMonth,
      currentTotals,
      previousTotals,
      incomeDiff,
      incomePct,
      expenseDiff,
      expensePct,
      netDiff,
      netPct,
      cashFlowDiff,
      cashFlowPct,
    }
  }

  async getExpenseCategories(filter?: CalculationFilter): Promise<CategoryBreakdown[]> {
    const breakdown = await this.apiService.calculations.byCategory(filter)
    return breakdown
      .filter((b) => b.type === 'expense' && b.total > 0)
      .sort((a, b) => b.total - a.total)
  }

  async getCategoryComparison(referenceDate: Date = new Date()): Promise<CategoryComparisonRow[]> {
    const currentMonth = getMonthPeriod(referenceDate)
    const previousMonth = getPreviousMonthPeriod(referenceDate)

    const [currentList, prevList] = await Promise.all([
      this.getExpenseCategories({ date_from: currentMonth.start, date_to: currentMonth.end }),
      this.getExpenseCategories({ date_from: previousMonth.start, date_to: previousMonth.end }),
    ])

    const map = new Map<string, { id: number; current: number; prev: number }>()

    for (const c of currentList) {
      map.set(c.category_name, { id: c.category_id, current: c.total, prev: 0 })
    }
    for (const p of prevList) {
      const existing = map.get(p.category_name)
      if (existing) {
        existing.prev = p.total
      } else {
        map.set(p.category_name, { id: p.category_id, current: 0, prev: p.total })
      }
    }

    const rows: CategoryComparisonRow[] = []
    for (const [name, data] of map.entries()) {
      const diff = data.current - data.prev
      const pctChange = safePercentChange(data.current, data.prev)
      rows.push({
        categoryId: data.id,
        categoryName: name,
        currentAmount: data.current,
        previousAmount: data.prev,
        diff,
        pctChange,
      })
    }

    return rows.sort((a, b) => b.diff - a.diff)
  }

  async getTopExpenses(limit = 5, filter?: CalculationFilter): Promise<Transaction[]> {
    const page = await this.apiService.transactions.list({
      type: ['expense'],
      sort_by: 'amount',
      sort_dir: 'desc',
      page: 1,
      page_size: limit,
      ...(filter?.date_from ? { date_from: filter.date_from } : {}),
      ...(filter?.date_to ? { date_to: filter.date_to } : {}),
    })
    return page.transactions
  }

  async getRecentTransactions(limit = 5): Promise<Transaction[]> {
    const page = await this.apiService.transactions.list({
      sort_by: 'date',
      sort_dir: 'desc',
      page: 1,
      page_size: limit,
    })
    return page.transactions
  }

  async getLargestTransaction(type?: 'income' | 'expense'): Promise<Transaction | null> {
    const page = await this.apiService.transactions.list({
      ...(type ? { type: [type] } : {}),
      sort_by: 'amount',
      sort_dir: 'desc',
      page: 1,
      page_size: 1,
    })
    return page.transactions[0] || null
  }

  async getTransactionsAboveAmount(threshold: number, limit = 10): Promise<Transaction[]> {
    const page = await this.apiService.transactions.list({
      sort_by: 'amount',
      sort_dir: 'desc',
      page: 1,
      page_size: 50,
    })
    return page.transactions.filter((tx) => tx.amount >= threshold).slice(0, limit)
  }

  async getUncategorizedTransactions(limit = 10): Promise<Transaction[]> {
    const page = await this.apiService.transactions.list({
      sort_by: 'date',
      sort_dir: 'desc',
      page: 1,
      page_size: 100,
    })
    return page.transactions
      .filter((tx) => !tx.category_id || !tx.category_name || tx.category_name.toLowerCase() === 'uncategorized')
      .slice(0, limit)
  }

  async getMonthlyTrend(monthsCount = 6): Promise<MonthlySummary[]> {
    const summaries = await this.apiService.calculations.monthly()
    return summaries.slice(-monthsCount)
  }
}

export const financialAnalysis = new FinancialAnalysisService()
