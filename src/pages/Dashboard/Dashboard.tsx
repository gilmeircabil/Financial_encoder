import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CashFlowChart from '../../components/charts/CashFlowChart'
import CategoryProgressList from '../../components/ui/CategoryProgressList'
import { Icon } from '../../components/ui/Icon'
import { KpiCard } from '../../components/ui/KpiCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { TransactionTable, TransactionColumn, TransactionRow } from '../../components/tables/TransactionTable'
import { api, ApiError } from '../../services/api'
import { useSettings } from '../../contexts/SettingsContext'
import { formatCurrency } from '../../utils/currency'
import { computeFinance } from '../../lib/finance'
import { cashFlowGranularity } from '../../utils/periods'
import { useDateRange } from '../../contexts/DateRangeContext'
import { GlobalDateRangeSelector } from '../../components/ui/GlobalDateRangeSelector'
import { logToMain } from '../../services/logger'
import type {
  CalculationFilter,
  CalculationTotals,
  CashFlowPoint,
  CategoryBreakdown,
  Transaction,
  TransactionPage,
} from '../../../electron/types/ipc'

const recentColumns: TransactionColumn[] = [
  { key: 'date', label: 'Date', className: 'tx-cell-date' },
  { key: 'description', label: 'Description', className: 'tx-cell-desc' },
  { key: 'category', label: 'Category', className: 'tx-cell-cat' },
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount', className: 'tx-table__amount' },
]

function Dashboard(): React.JSX.Element {
  const { settings } = useSettings()
  const currencyCode = settings?.currency ?? 'PHP'
  const dateFormat = settings?.dateFormat ?? 'YYYY-MM-DD'

  const { range, period, periodLabel, customInvalid } = useDateRange()

  const [totals, setTotals] = useState<CalculationTotals | null>(null)
  const [cashFlow, setCashFlow] = useState<CashFlowPoint[]>([])
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([])
  const [recent, setRecent] = useState<TransactionPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryTab, setCategoryTab] = useState<'expense' | 'income'>('expense')

  const granularity = useMemo(() => cashFlowGranularity(range), [range])

  const calcFilter = useMemo<CalculationFilter>(
    () => ({
      ...(range.date_from ? { date_from: range.date_from } : {}),
      ...(range.date_to ? { date_to: range.date_to } : {}),
    }),
    [range],
  )

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    if (customInvalid) {
      setLoading(false)
      return
    }

    try {
      const [totalsResult, cashFlowResult, breakdownResult, recentResult] = await Promise.all([
        api.calculations.totals(calcFilter),
        api.calculations.cashFlow(calcFilter, granularity),
        api.calculations.byCategory(calcFilter),
        api.transactions.list({
          page: 1,
          page_size: 8,
          sort_by: 'date',
          sort_dir: 'desc',
          ...(calcFilter.date_from ? { date_from: calcFilter.date_from } : {}),
          ...(calcFilter.date_to ? { date_to: calcFilter.date_to } : {}),
        }),
      ])
      setTotals(totalsResult)
      setCashFlow(cashFlowResult)
      setBreakdown(breakdownResult)
      setRecent(recentResult)
    } catch (err) {
      const message = (err as ApiError).message ?? 'Dashboard data could not be loaded.'
      setError(message)
      logToMain('error', 'load dashboard failed', { message })
    } finally {
      setLoading(false)
    }
  }, [calcFilter, granularity, customInvalid])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const handleSaved = () => {
      void load()
    }
    window.addEventListener('transaction-saved', handleSaved)
    return () => window.removeEventListener('transaction-saved', handleSaved)
  }, [load])

  const metrics = useMemo(() => computeFinance(totals), [totals])

  const incomeCount = useMemo(
    () => breakdown.filter((b) => b.type === 'income').reduce((sum, b) => sum + b.count, 0),
    [breakdown],
  )
  const expenseCount = useMemo(
    () => breakdown.filter((b) => b.type === 'expense').reduce((sum, b) => sum + b.count, 0),
    [breakdown],
  )
  const capitalCount = useMemo(
    () => breakdown.filter((b) => b.type === 'capital' || b.type === 'withdrawal').reduce((sum, b) => sum + b.count, 0),
    [breakdown],
  )

  const highExpenseAnomaly = useMemo(() => {
    if (!recent?.transactions || metrics.totalExpenses <= 0) return null
    return (
      recent.transactions.find(
        (tx) => tx.type === 'expense' && tx.amount >= 1_000_000 && tx.amount / metrics.totalExpenses >= 0.5,
      ) ?? null
    )
  }, [recent, metrics.totalExpenses])

  const expenseCategories = useMemo(
    () => breakdown.filter((c) => c.type === 'expense').slice(0, 5),
    [breakdown],
  )

  const incomeCategories = useMemo(
    () => breakdown.filter((c) => c.type === 'income').slice(0, 5),
    [breakdown],
  )

  const daysInPeriod = useMemo(() => {
    if (calcFilter.date_from && calcFilter.date_to) {
      const from = new Date(calcFilter.date_from).getTime()
      const to = new Date(calcFilter.date_to).getTime()
      const diff = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1
      return Math.max(1, diff)
    }
    if (period === 'this-month') return 30
    if (period === 'last-3-months') return 90
    if (period === 'this-year') return 365
    return 30
  }, [calcFilter.date_from, calcFilter.date_to, period])

  const dailyBurn = useMemo(() => {
    if (metrics.totalExpenses <= 0) return 0
    return metrics.totalExpenses / daysInPeriod
  }, [metrics.totalExpenses, daysInPeriod])

  const savingsRate = useMemo(() => {
    if (metrics.totalIncome <= 0) return metrics.totalExpenses > 0 ? -100 : 0
    return ((metrics.totalIncome - metrics.totalExpenses) / metrics.totalIncome) * 100
  }, [metrics.totalIncome, metrics.totalExpenses])

  const coverageRatio = useMemo(() => {
    if (metrics.totalExpenses <= 0) return metrics.totalIncome > 0 ? 99 : 1
    return metrics.totalIncome / metrics.totalExpenses
  }, [metrics.totalIncome, metrics.totalExpenses])

  const topExpense = expenseCategories[0]

  const recentTableData = useMemo<TransactionRow[]>(() => {
    if (!recent?.transactions) return []
    return recent.transactions.map((tx: Transaction) => ({
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category_name: tx.category_name,
      notes: tx.notes,
    }))
  }, [recent])

  return (
    <div className="page dashboard-page">
      <GlobalDateRangeSelector className="dash-toolbar-strip" />

      {error ? (
        <div role="alert" className="notice notice--error">{error}</div>
      ) : null}

      {highExpenseAnomaly && (
        <div className="dash-anomaly-banner" role="status">
          <div className="dash-anomaly-banner__icon">
            <Icon name="shield" size={16} />
          </div>
          <div className="dash-anomaly-banner__content">
            <span className="dash-anomaly-banner__title">Financial Anomaly Notice</span>
            <span className="dash-anomaly-banner__desc">
              High-value expense recorded: <strong>{highExpenseAnomaly.description}</strong> ({formatCurrency(highExpenseAnomaly.amount, currencyCode)}) accounts for {Math.round((highExpenseAnomaly.amount / metrics.totalExpenses) * 100)}% of expenses.
            </span>
          </div>
          <Link to="/transactions" className="dash-anomaly-banner__link">
            Inspect in Ledger →
          </Link>
        </div>
      )}

      {loading && !totals ? (
        <div className="spinner" style={{ margin: '32px auto' }} aria-label="Loading dashboard" />
      ) : totals ? (
        <>
          {/* Top 4 Summary Cards spanning full width */}
          <div className="dash-summary dash-summary--4">
            <KpiCard
              label="Total Income"
              value={metrics.totalIncome}
              currencyCode={currencyCode}
              variant="positive"
              icon="arrowUp"
              subtitle={incomeCount > 0 ? (incomeCount === 1 ? '1 transaction' : `${incomeCount} transactions`) : 'No income in range'}
              trendString={incomeCount > 0 ? '+100% vs. last month' : undefined}
              trendDirection="up"
              actionLink="#/income"
              actionAriaLabel="View Income Breakdown"
            />
            <KpiCard
              label="Total Expenses"
              value={metrics.totalExpenses}
              currencyCode={currencyCode}
              variant="negative"
              icon="arrowDown"
              subtitle={expenseCount > 0 ? (expenseCount === 1 ? '1 transaction' : `${expenseCount} transactions`) : 'No expenses in range'}
              trendString={expenseCount > 0 ? '-100% vs. last month' : undefined}
              trendDirection="down"
              actionLink="#/expenses"
              actionAriaLabel="View Expense Breakdown"
            />
            <KpiCard
              label="Net Cash Flow"
              value={metrics.cashPosition}
              currencyCode={currencyCode}
              variant={metrics.cashPosition >= 0 ? 'positive' : 'negative'}
              icon="wallet"
              subtitle="Income - Expenses"
              trendString={metrics.cashPosition < 0 ? '-100% vs. last month' : '+100% vs. last month'}
              trendDirection={metrics.cashPosition < 0 ? 'down' : 'up'}
              actionLink="#/cash-flow"
              actionAriaLabel="View Cash Flow Analysis"
            />
            <KpiCard
              label="Capital & Equity"
              value={metrics.netEquity}
              currencyCode={currencyCode}
              variant="capital"
              icon="capital"
              subtitle={capitalCount > 0 ? `${capitalCount} movements` : 'No recorded movements'}
              trendString="0% vs. last month"
              trendDirection="neutral"
              actionLink="#/capital"
              actionAriaLabel="View Capital Structure"
            />
          </div>

          <div className="dash-grid">
            {/* Main Left Column (Income vs Expenses Spline Curve Chart) */}
            <div className="dash-main-col">
              <div className="card dash-cf">
                <div className="dash-cf__heading">
                  <div>
                    <h3 className="card__title">Income vs. Expenses</h3>
                    <span className="dash-cf__subtitle">Monthly cash flow comparison over selected timeline</span>
                  </div>
                  <div className="dash-cf__actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {period === 'custom' && (
                      <span className="date-range-plain-text">{periodLabel}</span>
                    )}
                    <span className="card__header-icon-action" aria-hidden="true" title="Chart display options">
                      <Icon name="filter" size={14} />
                    </span>
                  </div>
                </div>

                <CashFlowChart data={cashFlow} currencyCode={currencyCode} height="100%" minHeight={300} granularity={granularity} includeCapital />
              </div>
            </div>

            {/* Right Column (Category Breakdown & Financial Health) */}
            <div className="dash-side-col">
              {/* Category Breakdown Donut Card */}
              <div className="card dash-donut-card">
                <div className="card__head-flex">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className="card__title" style={{ margin: 0 }}>Category Breakdown</h3>
                    <div className="cf-tabs" role="tablist" aria-label="Category view" style={{ margin: 0 }}>
                      <button
                        type="button"
                        className={`cf-tab-pill${categoryTab === 'expense' ? ' cf-tab-pill--active' : ''}`}
                        onClick={() => setCategoryTab('expense')}
                        role="tab"
                        aria-selected={categoryTab === 'expense'}
                      >
                        Expenses
                      </button>
                      <button
                        type="button"
                        className={`cf-tab-pill${categoryTab === 'income' ? ' cf-tab-pill--active' : ''}`}
                        onClick={() => setCategoryTab('income')}
                        role="tab"
                        aria-selected={categoryTab === 'income'}
                      >
                        Income
                      </button>
                    </div>
                  </div>
                  <Link to={categoryTab === 'expense' ? '/expenses' : '/income'} className="card__sublink">
                    Breakdown →
                  </Link>
                </div>
                <CategoryProgressList
                  items={categoryTab === 'expense' ? expenseCategories : incomeCategories}
                  currencyCode={currencyCode}
                  emptyMessage={categoryTab === 'expense' ? 'No expenses recorded for this timeframe.' : 'No income recorded for this timeframe.'}
                  maxItems={5}
                  centerLabel={categoryTab === 'expense' ? 'Expenses' : 'Income'}
                />
              </div>

              {/* Financial Health & Efficiency Card */}
              <div className="card dash-health-card">
                <div className="card__head-flex" style={{ marginBottom: '8px' }}>
                  <h3 className="card__title" style={{ margin: 0 }}>Financial Health</h3>
                  <span className={`badge ${metrics.netProfit >= 0 ? 'badge--income' : 'badge--expense'}`}>
                    {metrics.netProfit >= 0 ? 'Positive Margin' : 'Net Deficit'}
                  </span>
                </div>
                <div className="dash-health-grid">
                  <div className="dash-health-item">
                    <span className="dash-health-item__label">Savings Rate</span>
                    <span className={`dash-health-item__value ${savingsRate >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                      {savingsRate >= 0 ? `+${savingsRate.toFixed(1)}%` : `${savingsRate.toFixed(1)}%`}
                    </span>
                    <span className="dash-health-item__sub">Net income retention</span>
                  </div>
                  <div className="dash-health-item">
                    <span className="dash-health-item__label">Coverage Ratio</span>
                    <span className={`dash-health-item__value ${coverageRatio >= 1 ? 'cf-positive' : 'cf-negative'}`}>
                      {coverageRatio >= 99 ? '∞' : `${coverageRatio.toFixed(2)}x`}
                    </span>
                    <span className="dash-health-item__sub">Inflows vs. outflows</span>
                  </div>
                  <div className="dash-health-item">
                    <span className="dash-health-item__label">Daily Average Burn</span>
                    <span className="dash-health-item__value cf-negative">
                      {formatCurrency(dailyBurn, currencyCode)}
                    </span>
                    <span className="dash-health-item__sub">Per calendar day</span>
                  </div>
                  <div className="dash-health-item">
                    <span className="dash-health-item__label">Top Spending</span>
                    <span className="dash-health-item__value" title={topExpense ? topExpense.category_name : undefined}>
                      {topExpense ? topExpense.category_name : 'None'}
                    </span>
                    <span className="dash-health-item__sub">
                      {topExpense ? `${formatCurrency(topExpense.total, currencyCode)} (${Math.round((topExpense.total / (metrics.totalExpenses || 1)) * 100)}%)` : 'No expenses'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions Card (Wide Table Layout) */}
          <Card>
            <CardHeader
              title="Recent Transactions"
              subtitle={
                recent && recent.total > 0
                  ? `Showing latest ${recentTableData.length} of ${recent.total} transaction${recent.total === 1 ? '' : 's'}`
                  : 'Latest logged movements'
              }
              action={
                <Link to="/transactions" className="dash-view-all-link">
                  <span>View all</span>
                  <Icon name="chevronRight" size={14} />
                </Link>
              }
            />
            <CardBody>
              {loading && !recent ? (
                <div className="spinner" style={{ margin: '24px auto' }} aria-label="Loading recent transactions" />
              ) : recentTableData.length === 0 ? (
                <EmptyState
                  icon="transactions"
                  title="No recent transactions"
                  description="No transactions logged in this period."
                />
              ) : (
                <TransactionTable
                  columns={recentColumns}
                  data={recentTableData}
                  currencyCode={currencyCode}
                  dateFormat={dateFormat}
                  showBalanceColumn={false}
                />
              )}
            </CardBody>
          </Card>
        </>
      ) : null}

    </div>
  )
}

export default Dashboard