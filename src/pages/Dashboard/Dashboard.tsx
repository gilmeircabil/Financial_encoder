import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CashFlowChart from '../../components/charts/CashFlowChart'
import CategoryProgressList from '../../components/ui/CategoryProgressList'
import { Icon } from '../../components/ui/Icon'
import { api, ApiError } from '../../services/api'
import { useSettings } from '../../contexts/SettingsContext'
import { formatCurrency, formatIntegerCurrency } from '../../utils/currency'
import { formatDate, parseISODate } from '../../utils/dates'
import { cashFlowPointsToChartData } from '../../utils/chart'
import {
  cashFlowGranularity,
  customRangeInvalid,
  PERIOD_KEYS,
  PERIOD_LABELS,
  periodRange,
  type PeriodKey,
} from '../../utils/periods'
import { logToMain } from '../../services/logger'
import type {
  CalculationFilter,
  CalculationTotals,
  CashFlowPoint,
  CategoryBreakdown,
  Transaction,
  TransactionPage,
} from '../../../electron/types/ipc'

function Dashboard(): React.JSX.Element {
  const { settings } = useSettings()
  const currencyCode = settings?.currency ?? 'PHP'
  const dateFormat = settings?.dateFormat ?? 'YYYY-MM-DD'

  const [period, setPeriod] = useState<PeriodKey>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const [totals, setTotals] = useState<CalculationTotals | null>(null)
  const [cashFlow, setCashFlow] = useState<CashFlowPoint[]>([])
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([])
  const [recent, setRecent] = useState<TransactionPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const range = useMemo(() => periodRange(period, customFrom, customTo), [period, customFrom, customTo])
  const granularity = useMemo(() => cashFlowGranularity(range), [range])
  const customInvalid = customRangeInvalid(customFrom, customTo)

  /** Single source of truth applied to every dashboard query. */
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
          page_size: 7,
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

  // Listen for global transaction events to auto refresh
  useEffect(() => {
    const handleSaved = () => {
      void load()
    }
    window.addEventListener('transaction-saved', handleSaved)
    return () => window.removeEventListener('transaction-saved', handleSaved)
  }, [load])

  const income = totals?.income ?? 0
  const expense = totals?.expense ?? 0
  const netPosition = income - expense
  const netCapital = (totals?.capital ?? 0) - (totals?.withdrawal ?? 0)

  // Calculations for secondary metrics
  const savingsRate = income > 0 ? Math.max(0, ((income - expense) / income) * 100) : 0
  const expenseRatio = income > 0 ? (expense / income) * 100 : 0

  const chartData = useMemo(() => cashFlowPointsToChartData(cashFlow, granularity), [cashFlow, granularity])

  const expenseCategories = useMemo(
    () => breakdown.filter((c) => c.type === 'expense').slice(0, 5),
    [breakdown],
  )

  const periodLabel = useMemo(() => {
    const from = range.date_from ? formatDate(parseISODate(range.date_from), dateFormat) : null
    const to = range.date_to ? formatDate(parseISODate(range.date_to), dateFormat) : null
    if (from && to) {
      return `${from} – ${to}`
    }
    if (from) {
      return `From ${from}`
    }
    if (to) {
      return `Up to ${to}`
    }
    return 'All time'
  }, [range, dateFormat])

  return (
    <div className="page dashboard-page">
      {/* Sleek Period Selector Bar */}
      <div className="dash-toolbar-strip">
        <div className="period-selector period-selector--pills" role="radiogroup" aria-label="Time period">
          {PERIOD_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`dash-period-pill${period === key ? ' dash-period-pill--active' : ''}`}
              role="radio"
              aria-checked={period === key}
              onClick={() => setPeriod(key)}
            >
              {PERIOD_LABELS[key]}
            </button>
          ))}
          <button
            type="button"
            className={`dash-period-pill${period === 'custom' ? ' dash-period-pill--active' : ''}`}
            role="radio"
            aria-checked={period === 'custom'}
            onClick={() => setPeriod('custom')}
          >
            Custom
          </button>
        </div>

        {period === 'custom' && (
          <div className="period-custom">
            <label className="field__label" htmlFor="dash-from">From</label>
            <input
              id="dash-from"
              type="date"
              className="text-input text-input--sm"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <label className="field__label" htmlFor="dash-to">To</label>
            <input
              id="dash-to"
              type="date"
              className="text-input text-input--sm"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        )}

        <span className="dash-range-pill">{periodLabel}</span>
      </div>

      {customInvalid ? (
        <div role="alert" className="notice notice--error">
          The "From" date must be on or before the "To" date.
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="notice notice--error">{error}</div>
      ) : null}

      {loading && !totals ? (
        <div className="spinner" style={{ margin: '32px auto' }} aria-label="Loading dashboard" />
      ) : totals ? (
        <div className="dash-grid">
          {/* Main Left Column (KPIs, Spline Curve Chart, Goals & Ledgers) */}
          <div className="dash-main-col">
            {/* Enhanced Finly Stat KPI Cards */}
            <div className="dash-summary">
              {/* Balance / Net Position */}
              <div className="card stat-card stat-card--net">
                <div className="stat-card__head">
                  <span className="stat-card__label">Balance</span>
                  <Link to="/cash-flow" className="stat-card__action-link" title="View Cash Flow Analysis" aria-label="View Cash Flow Analysis">
                    <Icon name="arrowUpRight" size={14} />
                  </Link>
                </div>
                <span className={`stat-card__value ${netPosition >= 0 ? 'stat-card__value--positive' : 'stat-card__value--negative'}`}>
                  {formatIntegerCurrency(netPosition, currencyCode)}
                </span>
                <div className="stat-card__footer">
                  <span className={`stat-card__badge ${netPosition >= 0 ? 'stat-card__badge--ok' : 'stat-card__badge--danger'}`}>
                    <span>{netPosition >= 0 ? 'Surplus Reserve' : 'Deficit'}</span>
                  </span>
                </div>
              </div>

              {/* Salary / Total Income */}
              <div className="card stat-card stat-card--income">
                <div className="stat-card__head">
                  <span className="stat-card__label">Salary &amp; Income</span>
                  <Link to="/income" className="stat-card__action-link" title="View Income Breakdown" aria-label="View Income Breakdown">
                    <Icon name="arrowUpRight" size={14} />
                  </Link>
                </div>
                <span className="stat-card__value stat-card__value--positive">
                  {formatIntegerCurrency(income, currencyCode)}
                </span>
                <div className="stat-card__footer">
                  {income > 0 ? (
                    <span className="stat-card__badge stat-card__badge--ok">
                      <Icon name="trendingUp" size={12} />
                      <span>{savingsRate.toFixed(1)}% saved</span>
                    </span>
                  ) : (
                    <span className="stat-card__subtext">No income in range</span>
                  )}
                </div>
              </div>

              {/* Total Expenses */}
              <div className="card stat-card stat-card--expense">
                <div className="stat-card__head">
                  <span className="stat-card__label">Expenses</span>
                  <Link to="/expenses" className="stat-card__action-link" title="View Expense Breakdown" aria-label="View Expense Breakdown">
                    <Icon name="arrowUpRight" size={14} />
                  </Link>
                </div>
                <span className="stat-card__value stat-card__value--negative">
                  {formatIntegerCurrency(expense, currencyCode)}
                </span>
                <div className="stat-card__footer">
                  {income > 0 ? (
                    <span className={`stat-card__badge ${expenseRatio > 80 ? 'stat-card__badge--warn' : 'stat-card__badge--neutral'}`}>
                      <span>{expenseRatio.toFixed(1)}% of income</span>
                    </span>
                  ) : (
                    <span className="stat-card__subtext">Operating outflows</span>
                  )}
                </div>
              </div>

              {/* Savings / Net Capital */}
              <div className="card stat-card stat-card--capital">
                <div className="stat-card__head">
                  <span className="stat-card__label">Savings &amp; Capital</span>
                  <Link to="/capital" className="stat-card__action-link" title="View Capital Structure" aria-label="View Capital Structure">
                    <Icon name="arrowUpRight" size={14} />
                  </Link>
                </div>
                <span className={`stat-card__value ${netCapital >= 0 ? 'stat-card__value--positive' : 'stat-card__value--negative'}`}>
                  {formatIntegerCurrency(netCapital, currencyCode)}
                </span>
                <div className="stat-card__footer">
                  <span className="stat-card__subtext">Equity &amp; investments</span>
                </div>
              </div>
            </div>

            {/* Income vs Expenses Spline Curve Chart */}
            <div className="card dash-cf">
              <div className="dash-cf__heading">
                <div>
                  <h3 className="card__title">Income vs. Expenses</h3>
                  <span className="dash-cf__subtitle">Smooth cash flow trajectory over selected timeline</span>
                </div>
                <span className="dash-range-pill">{periodLabel}</span>
              </div>

              <CashFlowChart data={chartData} currencyCode={currencyCode} height={310} />
            </div>
          </div>

          {/* Right Column (Recent Transactions, Expense Categories Donut) */}
          <div className="dash-side-col">
            {/* Recent Transactions Card */}
            <div className="card dash-recent">
              <div className="dash-recent__header">
                <div>
                  <h3 className="card__title">Recent Transactions</h3>
                  <span className="dash-recent__subtitle">Latest logged movements</span>
                </div>
                <Link to="/transactions" className="dash-view-all-link">
                  <span>View all</span>
                  <Icon name="chevronRight" size={14} />
                </Link>
              </div>

              {recent && recent.transactions.length > 0 ? (
                <ul className="dash-list">
                  {recent.transactions.slice(0, 4).map((tx: Transaction) => {
                    const isOutflow = tx.type === 'expense' || tx.type === 'withdrawal'
                    const iconName = tx.type === 'income' ? 'arrowUp' : tx.type === 'capital' ? 'capital' : 'arrowDown'
                    return (
                      <li key={tx.id} className="dash-list__item">
                        <div className={`dash-list__avatar dash-list__avatar--${tx.type}`} aria-hidden="true">
                          <Icon name={iconName} size={15} />
                        </div>
                        <div className="dash-list__main">
                          <span className="dash-list__desc" title={tx.description}>
                            {tx.description}
                          </span>
                          <span className="dash-list__meta">
                            {formatDate(parseISODate(tx.date), dateFormat)} · {tx.category_name}
                          </span>
                        </div>
                        <div className="dash-list__right">
                          <span className={`dash-list__amount ${isOutflow ? 'cf-negative' : 'cf-positive'}`}>
                            {isOutflow ? '-' : '+'}{formatCurrency(tx.amount, currencyCode)}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="dash-recent__empty-box">
                  <Icon name="transactions" size={28} />
                  <p>No transactions logged in this period.</p>
                </div>
              )}
            </div>

            {/* Expense Categories Donut Card */}
            <div className="card dash-donut-card">
              <div className="card__head-flex">
                <h3 className="card__title">Expense Categories</h3>
                <Link to="/expenses" className="card__sublink">
                  Breakdown →
                </Link>
              </div>
              <CategoryProgressList
                items={expenseCategories}
                currencyCode={currencyCode}
                emptyMessage="No expenses recorded for this timeframe."
                maxItems={5}
                centerLabel="Expenses"
              />
            </div>
          </div>
        </div>
      ) : null}

    </div>
  )
}

export default Dashboard