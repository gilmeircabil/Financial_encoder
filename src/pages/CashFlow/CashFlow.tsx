import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import CashFlowChart from '../../components/charts/CashFlowChart'
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
  MonthlySummary,
} from '../../../electron/types/ipc'

function CashFlow(): React.JSX.Element {
  const { settings } = useSettings()
  const { success, error: toastError } = useToast()
  const currencyCode = settings?.currency ?? 'PHP'

  const { period, setPeriod, range, customInvalid } = useDateRange()



  const [totals, setTotals] = useState<CalculationTotals | null>(null)
  const [monthly, setMonthly] = useState<MonthlySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)




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
      const [totalsResult, monthlyResult] = await Promise.all([
        api.calculations.totals(calcFilter),
        api.calculations.monthly(calcFilter),
      ])
      setTotals(totalsResult)
      setMonthly(monthlyResult)
    } catch (err) {
      const message = (err as ApiError).message ?? 'Cash flow data could not be loaded.'
      setError(message)
      logToMain('error', 'load cash flow page failed', { message })
    } finally {
      setLoading(false)
    }
  }, [range, customInvalid])

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

  const metrics = computeFinance(totals)
  const inflows = metrics.totalIncome + metrics.capitalAdded
  const outflows = metrics.totalExpenses + metrics.totalWithdrawals
  const netCash = metrics.cashPosition
  const coverageRatio = outflows > 0 ? inflows / outflows : inflows > 0 ? 100 : 0

  const chartData = useMemo(
    () => monthlyToCashFlowChartData(monthly, true),
    [monthly],
  )

  const handleExportCsv = async (): Promise<void> => {
    setExporting(true)
    try {
      await api.exports.file({
        format: 'csv',
        filter: {
          ...(range.date_from ? { date_from: range.date_from } : {}),
          ...(range.date_to ? { date_to: range.date_to } : {}),
        },
      })
      success('Cash flow data exported to CSV!')
    } catch (err) {
      if ((err as ApiError).message !== 'Export cancelled.') {
        toastError((err as ApiError).message ?? 'Export failed.')
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="page cashflow-page">
      <PageHeader
        title="Cash Flow"
        description="Monitor liquidity movements, net burn velocity, and monthly capital flow."
        actions={
          <div className="page-header__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleExportCsv}
              disabled={exporting || !totals || totals.count === 0}
              title="Export cash flow as CSV"
            >
              <Icon name="download" size={15} />
              <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
            </button>
          </div>
        }
      />

      <div className="card page-toolbar">
        <GlobalDateRangeSelector />
      </div>

      {error ? (
        <div role="alert" className="notice notice--error">{error}</div>
      ) : null}

      {/* Summary KPI cards */}
      {loading && !totals ? (
        <div className="spinner" style={{ margin: '24px auto' }} aria-label="Loading cash flow" />
      ) : totals ? (
        <div className="dash-summary">
          <div className="card stat-card stat-card--income">
            <div className="stat-card__head">
              <span className="stat-card__label">Total Inflows</span>
              <div className="stat-card__icon" aria-hidden="true">
                <Icon name="arrowUp" size={17} />
              </div>
            </div>
            <span className="stat-card__value stat-card__value--positive" title={formatCurrency(inflows, currencyCode)}>{formatCompactCurrency(inflows, currencyCode)}</span>
            <div className="stat-card__footer">
              <span className="stat-card__subtext">Income + Capital Injections</span>
            </div>
          </div>

          <div className="card stat-card stat-card--expense">
            <div className="stat-card__head">
              <span className="stat-card__label">Total Outflows</span>
              <div className="stat-card__icon" aria-hidden="true">
                <Icon name="arrowDown" size={17} />
              </div>
            </div>
            <span className="stat-card__value stat-card__value--negative" title={formatCurrency(outflows, currencyCode)}>{formatCompactCurrency(outflows, currencyCode)}</span>
            <div className="stat-card__footer">
              <span className="stat-card__subtext">Expenses + Owner Withdrawals</span>
            </div>
          </div>

          <div className="card stat-card stat-card--net">
            <div className="stat-card__head">
              <span className="stat-card__label">Net Cash Movement</span>
              <div className="stat-card__icon" aria-hidden="true">
                <Icon name="wallet" size={17} />
              </div>
            </div>
            <span className={`stat-card__value ${netCash >= 0 ? 'stat-card__value--positive' : 'stat-card__value--negative'}`} title={formatCurrency(netCash, currencyCode)}>{formatCompactCurrency(netCash, currencyCode)}</span>
            <div className="stat-card__footer">
              <span className={`stat-card__badge ${netCash >= 0 ? 'stat-card__badge--ok' : 'stat-card__badge--danger'}`}>
                <span>{netCash >= 0 ? 'Positive Inflow' : 'Negative Outflow'}</span>
              </span>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-card__head">
              <span className="stat-card__label">Inflow/Outflow Coverage</span>
              <div className="stat-card__icon" aria-hidden="true">
                <Icon name="trendingUp" size={17} />
              </div>
            </div>
            <span className="stat-card__value">
              {coverageRatio.toFixed(2)}x
            </span>
            <div className="stat-card__footer">
              <span className="stat-card__subtext">
                {coverageRatio >= 1 ? 'Positive liquidity coverage' : 'Burn exceeds income'}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Monthly cash flow */}
      {!loading && monthly.length === 0 ? (
        <EmptyState
          icon="cashflow"
          title="No cash flow data"
          description={period !== 'all' ? 'No transactions match the selected period.' : 'Record some transactions to see cash flow breakdowns.'}
        >
          {period !== 'all' && (
            <button type="button" className="btn btn--secondary" onClick={() => setPeriod('all')}>
              Show all
            </button>
          )}
        </EmptyState>
      ) : monthly.length > 0 ? (
        <>
          <div className="card page-cf">
            <div className="card__head-flex">
              <h3 className="card__title">Cash Flow Trajectory</h3>
            </div>
            <CashFlowChart data={chartData} currencyCode={currencyCode} height={280} />
          </div>

          {/* Monthly ledger table */}
          <div className="card">
            <h3 className="card__title">Monthly Cash Position Breakdown</h3>
            <div className="tx-table-wrap">
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="tx-table__amount">Income</th>
                    <th className="tx-table__amount">Expenses</th>
                    <th className="tx-table__amount">Inflow (Inc + Cap)</th>
                    <th className="tx-table__amount">Outflow (Exp + Wdr)</th>
                    <th className="tx-table__amount">Net Cash Flow</th>
                    <th style={{ textAlign: 'center' }}>Health</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((row) => {
                    const rowInflow = row.income + row.capital
                    const rowOutflow = row.expense + row.withdrawal
                    const net = rowInflow - rowOutflow
                    return (
                      <tr key={row.month} className="tx-row">
                        <td style={{ fontWeight: 600 }}>{formatMonth(row.month)}</td>
                        <td className="tx-table__amount cf-positive">{formatCurrency(row.income, currencyCode)}</td>
                        <td className="tx-table__amount cf-negative">{formatCurrency(row.expense, currencyCode)}</td>
                        <td className="tx-table__amount cf-positive">+{formatCurrency(rowInflow, currencyCode)}</td>
                        <td className="tx-table__amount cf-negative">-{formatCurrency(rowOutflow, currencyCode)}</td>
                        <td className={`tx-table__amount ${net >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                          <span className="tx-amount-badge">
                            {net >= 0 ? '+' : ''}{formatCurrency(net, currencyCode)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${net >= 0 ? 'badge--income' : 'badge--expense'}`}>
                            {net >= 0 ? 'Surplus' : 'Deficit'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default CashFlow