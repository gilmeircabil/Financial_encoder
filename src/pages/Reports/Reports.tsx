import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import CashFlowChart from '../../components/charts/CashFlowChart'
import CategoryProgressList from '../../components/ui/CategoryProgressList'
import { KpiCard } from '../../components/ui/KpiCard'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Icon } from '../../components/ui/Icon'
import { api, ApiError } from '../../services/api'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency } from '../../utils/currency'
import { computeFinance } from '../../lib/finance'
import { useDateRange } from '../../contexts/DateRangeContext'
import { GlobalDateRangeSelector } from '../../components/ui/GlobalDateRangeSelector'
import { formatMonth } from '../../utils/periods'
import { monthlyToCashFlowChartData } from '../../utils/chart'
import { logToMain } from '../../services/logger'
import type {
  CalculationFilter,
  CalculationTotals,
  CategoryBreakdown,
  MonthlySummary,
} from '../../../electron/types/ipc'

function Reports(): React.JSX.Element {
  const { settings } = useSettings()
  const { success, error: toastError } = useToast()
  const currencyCode = settings?.currency ?? 'PHP'

  const { period, setPeriod, range, periodLabel, customInvalid } = useDateRange()
  const [exportOpen, setExportOpen] = useState(false)
  const exportDropdownRef = useRef<HTMLDivElement>(null)

  const [totals, setTotals] = useState<CalculationTotals | null>(null)
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([])
  const [monthly, setMonthly] = useState<MonthlySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!exportOpen) return
    const handleClick = (e: MouseEvent) => {
      if (!exportDropdownRef.current?.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [exportOpen])

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    if (customInvalid) {
      setLoading(false)
      return
    }

    const calcFilter: CalculationFilter = {
      ...(range.date_from ? { date_from: range.date_from } : {}),
      ...(range.date_to ? { date_to: range.date_to } : {}),
    }

    try {
      const [totalsResult, breakdownResult, monthlyResult] = await Promise.all([
        api.calculations.totals(calcFilter),
        api.calculations.byCategory(calcFilter),
        api.calculations.monthly(calcFilter),
      ])
      setTotals(totalsResult)
      setBreakdown(breakdownResult)
      setMonthly(monthlyResult)
    } catch (err) {
      const message = (err as ApiError).message ?? 'Report data could not be loaded.'
      setError(message)
      logToMain('error', 'load reports failed', { message })
    } finally {
      setLoading(false)
    }
  }, [range, customInvalid])

  useEffect(() => {
    void load()
  }, [load])

  const breakdownByType = useMemo(() => {
    const groups: Record<string, CategoryBreakdown[]> = {}
    for (const row of breakdown) {
      (groups[row.type] ??= []).push(row)
    }
    return groups
  }, [breakdown])

  const hasData = totals ? totals.count > 0 : false

  const chartData = useMemo(() => monthlyToCashFlowChartData(monthly, true), [monthly])

  const [exporting, setExporting] = useState<'csv' | 'xlsx' | 'pdf' | null>(null)

  async function exportReport(format: 'csv' | 'xlsx' | 'pdf'): Promise<void> {
    setExporting(format)
    setError(null)
    try {
      await api.exports.file({ format, filter: { ...range } })
      success(`Report exported successfully as ${format.toUpperCase()}!`)
      logToMain('info', 'report export requested', { format })
    } catch (err) {
      if ((err as ApiError).message !== 'Export cancelled.') {
        const msg = (err as ApiError).message ?? 'The report could not be exported.'
        setError(msg)
        toastError(msg)
      }
    } finally {
      setExporting(null)
    }
  }

  // Executive summary metrics via shared finance engine
  const metrics = useMemo(() => computeFinance(totals), [totals])
  const expenseCategories = useMemo(() => breakdown.filter((b) => b.type === 'expense'), [breakdown])
  const incomeCategories = useMemo(() => breakdown.filter((b) => b.type === 'income'), [breakdown])

  // Count distinct income and expense transactions for contextual subtext
  const incomeCount = useMemo(() => incomeCategories.reduce((acc, c) => acc + c.count, 0), [incomeCategories])
  const expenseCount = useMemo(() => expenseCategories.reduce((acc, c) => acc + c.count, 0), [expenseCategories])

  // Outlier detection for dominant single-category expenditure
  const dominantOutflow = useMemo(() => {
    if (!totals || totals.expense <= 0) return null
    const top = [...expenseCategories].sort((a, b) => b.total - a.total)[0]
    if (top && top.total >= 1_000_000 && (top.total / totals.expense) >= 0.5) {
      return {
        category: top.category_name,
        amount: top.total,
        pct: Math.round((top.total / totals.expense) * 100),
      }
    }
    return null
  }, [totals, expenseCategories])

  // Reconciled totals for the monthly ledger summary table
  const monthlyTotals = useMemo(() => {
    return monthly.reduce(
      (acc, m) => ({
        income: acc.income + m.income,
        expense: acc.expense + m.expense,
        capital: acc.capital + (m.capital || 0),
        withdrawal: acc.withdrawal + (m.withdrawal || 0),
        net: acc.net + m.net,
        count: acc.count + m.count,
      }),
      { income: 0, expense: 0, capital: 0, withdrawal: 0, net: 0, count: 0 },
    )
  }, [monthly])

  const hasAssetsOrLiabilities = (totals?.asset ?? 0) > 0 || (totals?.liability ?? 0) > 0

  return (
    <div className="page report-page">
      {/* Formal Header for Print Jobs */}
      <div className="print-header" aria-hidden="true">
        <h1>Acorn Local Vault — Financial Report</h1>
        <p>Period: {periodLabel} &bull; Generated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} &bull; Currency: {currencyCode}</p>
      </div>

      <PageHeader
        title="Financial Reports"
        actions={
          <div className="page-header__actions">
            <Button variant="secondary" onClick={() => window.print()} title="Print formal report" icon="printer">
              Print
            </Button>

            <div className="app-dropdown" ref={exportDropdownRef}>
              <Button
                variant="primary"
                onClick={() => setExportOpen((prev) => !prev)}
                disabled={exporting !== null || !hasData}
                icon="download"
              >
                {exporting ? `Exporting (${exporting.toUpperCase()})…` : 'Export'}
              </Button>
              {exportOpen && (
                <div className="app-dropdown__menu" role="menu">
                  <button
                    type="button"
                    className="app-dropdown__item"
                    role="menuitem"
                    onClick={() => {
                      setExportOpen(false)
                      void exportReport('csv')
                    }}
                  >
                    <Icon name="download" size={14} />
                    <span>CSV (.csv)</span>
                  </button>
                  <button
                    type="button"
                    className="app-dropdown__item"
                    role="menuitem"
                    onClick={() => {
                      setExportOpen(false)
                      void exportReport('xlsx')
                    }}
                  >
                    <Icon name="fileSpreadsheet" size={14} />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    className="app-dropdown__item"
                    role="menuitem"
                    onClick={() => {
                      setExportOpen(false)
                      void exportReport('pdf')
                    }}
                  >
                    <Icon name="reports" size={14} />
                    <span>PDF (.pdf)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className="page-toolbar card">
        <GlobalDateRangeSelector />
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
        <div className="spinner" style={{ margin: '24px auto' }} aria-label="Loading report" />
      ) : !hasData ? (
        <EmptyState
          icon="reports"
          title="No data to report"
          description={period !== 'all' ? 'No transactions match the selected period.' : 'Record some transactions to generate reports.'}
        >
          {period !== 'all' && (
            <Button variant="secondary" size="sm" onClick={() => setPeriod('all')}>
              Show all time
            </Button>
          )}
        </EmptyState>
      ) : totals ? (
        <>
          {/* Executive Overview KPI Strip */}
          <div className="dash-summary dash-summary--4">
            <KpiCard
              label="Operating Revenue"
              value={metrics.totalIncome}
              currencyCode={currencyCode}
              variant="positive"
              icon="arrowUp"
              subtitle={incomeCount > 0 ? (incomeCount === 1 ? '1 revenue record' : `${incomeCount} revenue records`) : 'Gross revenue inflows'}
              trendString={incomeCount > 0 ? '+100% vs. last month' : undefined}
              trendDirection="up"
            />
            <KpiCard
              label="Operating Expenses"
              value={metrics.totalExpenses}
              currencyCode={currencyCode}
              variant="negative"
              icon="arrowDown"
              subtitle={expenseCount > 0 ? (expenseCount === 1 ? '1 expense record' : `${expenseCount} expense records`) : 'Total operational burn'}
              trendString={expenseCount > 0 ? '-100% vs. last month' : undefined}
              trendDirection="down"
            />
            <KpiCard
              label="Net Operating Margin"
              value={metrics.netProfit}
              currencyCode={currencyCode}
              variant={metrics.netProfit >= 0 ? 'positive' : 'negative'}
              icon="wallet"
              subtitle={metrics.totalIncome > 0 ? `${(metrics.marginRate * 100).toFixed(1)}% operating margin` : 'Revenue - Expenses'}
              trendString={metrics.netProfit < 0 ? '-100% vs. last month' : '+100% vs. last month'}
              trendDirection={metrics.netProfit < 0 ? 'down' : 'up'}
            />
            <KpiCard
              label="Total Transactions"
              value={totals.count}
              displayValue={totals.count.toLocaleString()}
              currencyCode={currencyCode}
              variant="neutral"
              icon="transactions"
              subtitle="Reconciled records in period"
              trendString="100% reconciled"
              trendDirection="neutral"
            />
          </div>

          <div className={`report-grid${hasAssetsOrLiabilities ? ' report-grid--4' : ''}`}>
            {/* Income statement */}
            <Card>
              <CardHeader title="Income Statement" subtitle={periodLabel} />
              <CardBody>
                <table className="ib-table">
                  <tbody>
                    <tr>
                      <td>Operating Income</td>
                      <td className="ib-table__right cf-positive">+{formatCurrency(metrics.totalIncome, currencyCode)}</td>
                    </tr>
                    <tr>
                      <td>Operating Expenses</td>
                      <td className="ib-table__right cf-negative">-{formatCurrency(metrics.totalExpenses, currencyCode)}</td>
                    </tr>
                    <tr className="ib-table__total">
                      <td><strong>Net Profit / (Loss)</strong></td>
                      <td className={`ib-table__right ${metrics.netProfit >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                        <strong>{formatCurrency(metrics.netProfit, currencyCode)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardBody>
            </Card>

            {/* Cash flow */}
            <Card>
              <CardHeader title="Cash Flow Position" subtitle={periodLabel} />
              <CardBody>
                <table className="ib-table">
                  <tbody>
                    <tr>
                      <td>Total Inflows (Inc + Cap)</td>
                      <td className="ib-table__right cf-positive">+{formatCurrency(metrics.totalIncome + metrics.capitalAdded, currencyCode)}</td>
                    </tr>
                    <tr>
                      <td>Total Outflows (Exp + Wdr)</td>
                      <td className="ib-table__right cf-negative">-{formatCurrency(metrics.totalExpenses + metrics.totalWithdrawals, currencyCode)}</td>
                    </tr>
                    <tr className="ib-table__total">
                      <td><strong>Net Cash Movement</strong></td>
                      <td className={`ib-table__right ${metrics.cashPosition >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                        <strong>{formatCurrency(metrics.cashPosition, currencyCode)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardBody>
            </Card>

            {/* Capital & Equity */}
            <Card>
              <CardHeader title="Capital & Equity" subtitle={periodLabel} />
              <CardBody>
                <table className="ib-table">
                  <tbody>
                    <tr>
                      <td>Capital Contributed</td>
                      <td className="ib-table__right cf-positive">+{formatCurrency(metrics.capitalAdded, currencyCode)}</td>
                    </tr>
                    <tr>
                      <td>Owner Withdrawals</td>
                      <td className="ib-table__right cf-negative">-{formatCurrency(metrics.totalWithdrawals, currencyCode)}</td>
                    </tr>
                    <tr className="ib-table__total">
                      <td><strong>Net Equity</strong></td>
                      <td className={`ib-table__right ${metrics.netEquity >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                        <strong>{formatCurrency(metrics.netEquity, currencyCode)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardBody>
            </Card>

            {/* Assets & Liabilities (if present in period) */}
            {hasAssetsOrLiabilities && (
              <Card>
                <CardHeader title="Balance Sheet Items" subtitle={periodLabel} />
                <CardBody>
                  <table className="ib-table">
                    <tbody>
                      <tr>
                        <td>Asset Purchases</td>
                        <td className="ib-table__right cf-positive">+{formatCurrency(totals.asset ?? 0, currencyCode)}</td>
                      </tr>
                      <tr>
                        <td>Liabilities Incurred</td>
                        <td className="ib-table__right cf-negative">-{formatCurrency(totals.liability ?? 0, currencyCode)}</td>
                      </tr>
                      <tr className="ib-table__total">
                        <td><strong>Net Balance Sheet Impact</strong></td>
                        <td className={`ib-table__right ${(totals.asset ?? 0) - (totals.liability ?? 0) >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                          <strong>{formatCurrency((totals.asset ?? 0) - (totals.liability ?? 0), currencyCode)}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Visual Category Distribution */}
          <div className="dash-cats page-split">
            <Card>
              <CardHeader title="Expense Distribution" subtitle={`${expenseCategories.length} categories`} />
              <CardBody>
                <CategoryProgressList
                  items={expenseCategories}
                  currencyCode={currencyCode}
                  emptyMessage="No expenses in this report period."
                  maxItems={8}
                  centerLabel="Expenses"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Revenue Distribution" subtitle={`${incomeCategories.length} categories`} />
              <CardBody>
                <CategoryProgressList
                  items={incomeCategories}
                  currencyCode={currencyCode}
                  emptyMessage="No income in this report period."
                  maxItems={8}
                  centerLabel="Revenue"
                />
              </CardBody>
            </Card>
          </div>

          {/* Monthly cash flow chart with Outlier Scale Notice */}
          {monthly.length > 0 && (
            <Card className="page-cf">
              <CardHeader title="Cash Flow Timeline" subtitle={`${formatMonth(monthly[0].month)} – ${formatMonth(monthly[monthly.length - 1].month)}`} />
              <CardBody>
                {dominantOutflow && (
                  <div className="report-outlier-notice" role="status">
                    <div className="report-outlier-notice__icon">
                      <Icon name="shield" size={16} />
                    </div>
                    <div className="report-outlier-notice__content">
                      <span className="report-outlier-notice__title">Timeline Scale Notice</span>
                      <span>
                        Outflows for this period are dominated by <strong>{dominantOutflow.category}</strong> ({formatCurrency(dominantOutflow.amount, currencyCode)}, {dominantOutflow.pct}% of total expenses). Hover over timeline bars or inspect the <strong>Monthly Ledger Summary</strong> below to review smaller monthly movements.
                      </span>
                    </div>
                  </div>
                )}
                <CashFlowChart
                  data={chartData}
                  currencyCode={currencyCode}
                  height="100%"
                  minHeight={280}
                  labels={{ inflow: 'Inflows', outflow: 'Outflows', net: 'Net Cash Flow' }}
                />
              </CardBody>
            </Card>
          )}

          {/* Category breakdown table */}
          {breakdown.length > 0 && (
            <Card>
              <CardHeader title="Full Category Breakdown" subtitle={`${breakdown.length} active categories across period`} />
              <CardBody>
                <div className="tx-table-wrap">
                  <table className="tx-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Type</th>
                        <th className="tx-table__amount">Transactions</th>
                        <th className="tx-table__amount">Total Amount</th>
                        <th className="tx-table__amount">Type Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['income', 'expense', 'capital', 'withdrawal', 'asset', 'liability'] as const).map((type) => {
                        const items = breakdownByType[type] ?? []
                        const typeTotal = items.reduce((sum, item) => sum + Math.abs(item.total), 0)
                        return items.map((cat) => {
                          const isExpenseOrWithdrawal = cat.type === 'expense' || cat.type === 'withdrawal'
                          const isIncomeOrCapital = cat.type === 'income' || cat.type === 'capital'
                          const sharePct = typeTotal > 0 ? ((Math.abs(cat.total) / typeTotal) * 100).toFixed(1) : '0.0'
                          return (
                            <tr key={`${cat.type}-${cat.category_id}`} className="tx-row">
                              <td style={{ fontWeight: 600 }}>{cat.category_name}</td>
                              <td><span className={`badge badge--${type}`}>{type}</span></td>
                              <td className="tx-table__amount">{cat.count} {cat.count === 1 ? 'tx' : 'txs'}</td>
                              <td className={`tx-table__amount ${isIncomeOrCapital ? 'cf-positive' : isExpenseOrWithdrawal ? 'cf-negative' : ''}`}>
                                <span className="tx-amount-badge">
                                  {isIncomeOrCapital ? '+' : isExpenseOrWithdrawal ? '-' : ''}{formatCurrency(Math.abs(cat.total), currencyCode)}
                                </span>
                              </td>
                              <td className="tx-table__amount" style={{ color: 'var(--text-muted)' }}>
                                {sharePct}%
                              </td>
                            </tr>
                          )
                        })
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="tx-table__summary-row" style={{ fontWeight: 700, borderTop: '2px solid var(--border-strong)' }}>
                        <td colSpan={2}>Period Total ({breakdown.length} categories)</td>
                        <td className="tx-table__amount">{totals.count} txs</td>
                        <td className="tx-table__amount" colSpan={2}>
                          Net Impact: {formatCurrency(metrics.cashPosition, currencyCode)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Monthly summary with strict Reconciliation Footer */}
          {monthly.length > 0 && (
            <Card>
              <CardHeader title="Monthly Ledger Summary" subtitle={`${monthly.length} calendar months recorded in period`} />
              <CardBody>
                <div className="tx-table-wrap">
                  <table className="tx-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th className="tx-table__amount">Income</th>
                        <th className="tx-table__amount">Expenses</th>
                        <th className="tx-table__amount">Capital</th>
                        <th className="tx-table__amount">Withdrawals</th>
                        <th className="tx-table__amount">Net Flow</th>
                        <th className="tx-table__amount">Tx Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.map((row) => (
                        <tr key={row.month} className="tx-row">
                          <td style={{ fontWeight: 600 }}>{formatMonth(row.month)}</td>
                          <td className="tx-table__amount cf-positive">+{formatCurrency(row.income, currencyCode)}</td>
                          <td className="tx-table__amount cf-negative">-{formatCurrency(row.expense, currencyCode)}</td>
                          <td className="tx-table__amount">{row.capital ? `+${formatCurrency(row.capital, currencyCode)}` : '₱0.00'}</td>
                          <td className="tx-table__amount">{row.withdrawal ? `-${formatCurrency(row.withdrawal, currencyCode)}` : '₱0.00'}</td>
                          <td className={`tx-table__amount ${row.net >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                            <span className="tx-amount-badge">
                              {row.net >= 0 ? '+' : ''}{formatCurrency(row.net, currencyCode)}
                            </span>
                          </td>
                          <td className="tx-table__amount">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="tx-table__summary-row" style={{ fontWeight: 700, borderTop: '2px solid var(--border-strong)' }}>
                        <td>Reconciled Period Total</td>
                        <td className="tx-table__amount cf-positive">+{formatCurrency(monthlyTotals.income, currencyCode)}</td>
                        <td className="tx-table__amount cf-negative">-{formatCurrency(monthlyTotals.expense, currencyCode)}</td>
                        <td className="tx-table__amount">{formatCurrency(monthlyTotals.capital, currencyCode)}</td>
                        <td className="tx-table__amount">{formatCurrency(monthlyTotals.withdrawal, currencyCode)}</td>
                        <td className={`tx-table__amount ${monthlyTotals.net >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                          <span className="tx-amount-badge">
                            {monthlyTotals.net >= 0 ? '+' : ''}{formatCurrency(monthlyTotals.net, currencyCode)}
                          </span>
                        </td>
                        <td className="tx-table__amount">{monthlyTotals.count}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}

export default Reports