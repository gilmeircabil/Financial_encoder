/**
 * Shared financial calculation logic for Financial Encoder (Acorn).
 * Pure functions with zero external dependencies.
 */

export interface FinancialTotals {
  income?: number
  expense?: number
  capital?: number
  withdrawal?: number
  asset?: number
  liability?: number
  net?: number
  count?: number
}

export interface FinancialMetrics {
  totalIncome: number
  totalExpenses: number
  capitalAdded: number
  totalWithdrawals: number
  netProfit: number
  cashPosition: number
  netEquity: number
  marginRate: number
}

/**
 * Net Profit = totalIncome - totalExpenses
 * Capital contributions are equity injections, NOT operating profit.
 */
export function netProfit(totalIncome: number, totalExpenses: number): number {
  return (totalIncome || 0) - (totalExpenses || 0)
}

/**
 * Cash Position = totalIncome + capitalAdded - totalExpenses - totalWithdrawals
 * Measures total net cash movement / liquidity position.
 */
export function cashPosition(
  totalIncome: number,
  capitalAdded: number,
  totalExpenses: number,
  totalWithdrawals: number,
): number {
  return (totalIncome || 0) + (capitalAdded || 0) - (totalExpenses || 0) - (totalWithdrawals || 0)
}

/**
 * Net Equity = capitalAdded - totalWithdrawals
 * Represents retained invested capital balance.
 */
export function netEquity(capitalAdded: number, totalWithdrawals: number): number {
  return (capitalAdded || 0) - (totalWithdrawals || 0)
}

/**
 * Margin Rate = netProfit / totalIncome
 * Returns 0 if totalIncome <= 0 or not finite.
 */
export function marginRate(profit: number, totalIncome: number): number {
  if (!totalIncome || totalIncome <= 0 || !Number.isFinite(totalIncome)) {
    return 0
  }
  return profit / totalIncome
}

/**
 * Computes all core financial metrics from a totals object.
 */
export function computeFinance(totals?: FinancialTotals | null): FinancialMetrics {
  const totalIncome = totals?.income ?? 0
  const totalExpenses = totals?.expense ?? 0
  const capitalAdded = totals?.capital ?? 0
  const totalWithdrawals = totals?.withdrawal ?? 0

  const profit = netProfit(totalIncome, totalExpenses)
  const cash = cashPosition(totalIncome, capitalAdded, totalExpenses, totalWithdrawals)
  const equity = netEquity(capitalAdded, totalWithdrawals)
  const margin = marginRate(profit, totalIncome)

  return {
    totalIncome,
    totalExpenses,
    capitalAdded,
    totalWithdrawals,
    netProfit: profit,
    cashPosition: cash,
    netEquity: equity,
    marginRate: margin,
  }
}

/**
 * Computes financial metrics directly from an array of transactions.
 */
export function computeFinanceFromTransactions(
  transactions: Array<{ type: string; amount: number }>,
): FinancialMetrics {
  let income = 0
  let expense = 0
  let capital = 0
  let withdrawal = 0

  for (const tx of transactions) {
    const amt = Number(tx.amount) || 0
    if (tx.type === 'income') income += amt
    else if (tx.type === 'expense') expense += amt
    else if (tx.type === 'capital') capital += amt
    else if (tx.type === 'withdrawal') withdrawal += amt
  }

  return computeFinance({
    income,
    expense,
    capital,
    withdrawal,
  })
}
