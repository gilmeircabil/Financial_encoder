import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import CashFlowChart from '../../components/charts/CashFlowChart'
import CategoryProgressList from '../../components/ui/CategoryProgressList'
import { Icon } from '../../components/ui/Icon'
import { api, ApiError } from '../../services/api'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency, formatCompactCurrency } from '../../utils/currency'
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

  return (
    <div className="page report-page">
      <PageHeader
        title="Financial Reports"
        description="Comprehensive income statements, cash flow analytics, and formal balance summaries."
        actions={
          <div className="page-header__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => window.print()}
              title="Print formal report"
            >
              <Icon name="printer" size={15} />
              <span>Print</span>
            </button>

            <div className="app-dropdown" ref={exportDropdownRef}>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setExportOpen((prev) => !prev)}
                disabled={exporting !== null || !hasData}
                aria-haspopup="true"
                aria-expanded={exportOpen}
              >
                <Icon name="download" size={15} />
                <span>{exporting ? `Exporting (${exporting.toUpperCase()})…` : 'Export'}</span>
                <Icon name="chevronDown" size={12} />
              </button>
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

      <div className="page-toolbar card" style={{ marginTop: 0 }}>
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
            <button type="button" className="btn btn--secondary" onClick={() => setPeriod('all')}>
              Show all time
            </button>
          )}
        </EmptyState>
      ) : totals ? (
        <>
          {/* Executive Overview KPI Strip */}
          <div className="dash-summary">
            <div className="card stat-card stat-card--income">
              <div className="stat-card__head">
                <span className="stat-card__label">Operating Revenue</span>
                <div className="stat-card__icon"><Icon name="arrowUp" size={17} /></div>
              </div>
              <span
                className="stat-card__value stat-card__value--positive"
                title={formatCurrency(metrics.totalIncome, currencyCode)}
              >
                {formatCompactCurrency(metrics.totalIncome, currencyCode)}
              </span>
              <div className="stat-card__footer">
                <span className="stat-card__subtext">Gross revenue inflows</span>
              </div>
            </div>

            <div className="card stat-card stat-card--expense">
              <div className="stat-card__head">
                <span className="stat-card__label">Operating Expenses</span>
                <div className="stat-card__icon"><Icon name="arrowDown" size={17} /></div>
              </div>
              <span
                className="stat-card__value stat-card__value--negative"
                title={formatCurrency(metrics.totalExpenses, currencyCode)}
              >
                {formatCompactCurrency(metrics.totalExpenses, currencyCode)}
              </span>
              <div className="stat-card__footer">
                <span className="stat-card__subtext">Total operational burn</span>
              </div>
            </div>

            <div className="card stat-card stat-card--net">
              <div className="stat-card__head">
                <span className="stat-card__label">Net Operating Margin</span>
                <div className="stat-card__icon"><Icon name="wallet" size={17} /></div>
              </div>
              <span
                className={`stat-card__value ${metrics.netProfit >= 0 ? 'stat-card__value--positive' : 'stat-card__value--negative'}`}
                title={formatCurrency(metrics.netProfit, currencyCode)}
              >
                {formatCompactCurrency(metrics.netProfit, currencyCode)}
              </span>
              <div className="stat-card__footer">
                <span className={`stat-card__badge ${metrics.netProfit >= 0 ? 'stat-card__badge--ok' : 'stat-card__badge--danger'}`}>
                  <span>{(metrics.marginRate * 100).toFixed(1)}% margin rate</span>
                </span>
              </div>
            </div>

            <div className="card stat-card stat-card--capital">
              <div className="stat-card__head">
                <span className="stat-card__label">Total Transactions</span>
                <div className="stat-card__icon"><Icon name="transactions" size={17} /></div>
              </div>
              <span className="stat-card__value">{totals.count.toLocaleString()}</span>
              <div className="stat-card__footer">
                <span className="stat-card__subtext">Records in period</span>
              </div>
            </div>
          </div>

          <div className="report-grid">
            {/* Income statement */}
            <div className="card report-block">
              <h3 className="card__title">Income Statement</h3>
              <p className="report-period">{periodLabel}</p>
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
            </div>

            {/* Cash flow */}
            <div className="card report-block">
              <h3 className="card__title">Cash Flow Position</h3>
              <p className="report-period">{periodLabel}</p>
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
            </div>

            {/* Capital */}
            <div className="card report-block">
              <h3 className="card__title">Capital &amp; Equity</h3>
              <p className="report-period">{periodLabel}</p>
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
            </div>
          </div>

          {/* Visual Category Distribution */}
          <div className="dash-cats">
            <div className="card">
              <h3 className="card__title">Expense Distribution</h3>
              <CategoryProgressList
                items={expenseCategories}
                currencyCode={currencyCode}
                emptyMessage="No expenses in this report period."
                maxItems={6}
              />
            </div>

            <div className="card">
              <h3 className="card__title">Revenue Distribution</h3>
              <CategoryProgressList
                items={incomeCategories}
                currencyCode={currencyCode}
                emptyMessage="No income in this report period."
                maxItems={6}
              />
            </div>
          </div>

          {/* Monthly cash flow chart */}
          {monthly.length > 0 && (
            <div className="card page-cf">
              <h3 className="card__title">Cash Flow Timeline</h3>
              <CashFlowChart
                data={chartData}
                currencyCode={currencyCode}
                height={260}
                labels={{ inflow: 'Inflows', outflow: 'Outflows', net: 'Net Cash Flow' }}
              />
            </div>
          )}

          {/* Category breakdown table */}
          {breakdown.length > 0 && (
            <div className="card">
              <h3 className="card__title">Full Category Breakdown</h3>
              <div className="tx-table-wrap">
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Type</th>
                      <th className="tx-table__amount">Transactions</th>
                      <th className="tx-table__amount">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['income', 'expense', 'capital', 'withdrawal', 'asset', 'liability'] as const).map((type) =>
                      (breakdownByType[type] ?? []).map((cat) => (
                        <tr key={cat.category_id} className="tx-row">
                          <td style={{ fontWeight: 600 }}>{cat.category_name}</td>
                          <td><span className={`badge badge--${type}`}>{type}</span></td>
                          <td className="tx-table__amount">{cat.count}</td>
                          <td className="tx-table__amount">{formatCurrency(cat.total, currencyCode)}</td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Monthly summary */}
          {monthly.length > 0 && (
            <div className="card">
              <h3 className="card__title">Monthly Ledger Summary</h3>
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
                        <td className="tx-table__amount cf-positive">{formatCurrency(row.income, currencyCode)}</td>
                        <td className="tx-table__amount cf-negative">{formatCurrency(row.expense, currencyCode)}</td>
                        <td className="tx-table__amount">{formatCurrency(row.capital, currencyCode)}</td>
                        <td className="tx-table__amount">{formatCurrency(row.withdrawal, currencyCode)}</td>
                        <td className={`tx-table__amount ${row.net >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                          <span className="tx-amount-badge">
                            {row.net >= 0 ? '+' : ''}{formatCurrency(row.net, currencyCode)}
                          </span>
                        </td>
                        <td className="tx-table__amount">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

export default Reports