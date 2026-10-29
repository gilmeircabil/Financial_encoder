import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import CashFlowChart from '../../components/charts/CashFlowChart'
import { Icon } from '../../components/ui/Icon'
import { KpiCard } from '../../components/ui/KpiCard'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
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
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type {
  CalculationFilter,
  CalculationTotals,
  MonthlySummary,
} from '../../../electron/types/ipc'

type BreakdownTab = 'inflow' | 'outflow'

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
  const [breakdownTab, setBreakdownTab] = useState<BreakdownTab>('inflow')

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
  const retentionRate = inflows > 0 ? ((inflows - outflows) / inflows) * 100 : 0

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

  // Monthly Breakdown Donut Data
  const donutData = useMemo(() => {
    if (breakdownTab === 'inflow') {
      const inc = metrics.totalIncome
      const cap = metrics.capitalAdded
      const tot = inc + cap
      const incPct = tot > 0 ? Math.round((inc / tot) * 100) : 0
      const capPct = tot > 0 ? Math.round((cap / tot) * 100) : 0
      return {
        total: tot,
        title: 'TOTAL INFLOWS',
        slices: [
          { name: 'Income', value: inc, color: '#10B981', pct: incPct },
          { name: 'Capital', value: cap, color: '#8067FF', pct: capPct },
        ],
      }
    } else {
      const exp = metrics.totalExpenses
      const wdr = metrics.totalWithdrawals
      const tot = exp + wdr
      const expPct = tot > 0 ? Math.round((exp / tot) * 100) : 0
      const wdrPct = tot > 0 ? Math.round((wdr / tot) * 100) : 0
      return {
        total: tot,
        title: 'TOTAL OUTFLOWS',
        slices: [
          { name: 'Expenses', value: exp, color: '#F87171', pct: expPct },
          { name: 'Withdrawals', value: wdr, color: '#F97316', pct: wdrPct },
        ],
      }
    }
  }, [breakdownTab, metrics])

  const hasData = (totals?.count ?? 0) > 0 || monthly.some((m) => m.count > 0 || m.income > 0 || m.expense > 0 || m.capital > 0 || m.withdrawal > 0)

  return (
    <div className="page cashflow-page">
      <PageHeader
        title="Cash Flow"
        actions={
          <div className="cf-header-actions page-header__actions-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GlobalDateRangeSelector variant="dropdown" />
            <Button
              variant="secondary"
              onClick={handleExportCsv}
              disabled={exporting || !totals || totals.count === 0}
              title={exporting ? 'Exporting…' : 'Export cash flow as CSV'}
              aria-label={exporting ? 'Exporting…' : 'Export cash flow as CSV'}
              icon="download"
              loading={exporting}
            />
          </div>
        }
      />

      {error ? (
        <div role="alert" className="notice notice--error">{error}</div>
      ) : null}

      {/* Summary KPI cards matching 4-column layout */}
      {loading && !totals ? (
        <div className="spinner" style={{ margin: '24px auto' }} aria-label="Loading cash flow" />
      ) : totals ? (
        <div className="dash-summary dash-summary--4">
          <KpiCard
            label="Total Inflows"
            value={inflows}
            currencyCode={currencyCode}
            variant="positive"
            icon="arrowUp"
            trendLabel="Income + Capital Injections"
          />
          <KpiCard
            label="Total Outflows"
            value={outflows}
            currencyCode={currencyCode}
            variant="negative"
            icon="arrowDown"
            trendLabel="Expenses + Owner Withdrawals"
          />
          <KpiCard
            label="Net Cash Movement"
            value={netCash}
            currencyCode={currencyCode}
            variant={netCash >= 0 ? 'positive' : 'negative'}
            icon="wallet"
            trendLabel={netCash >= 0 ? 'Positive Inflow' : 'Negative Outflow'}
          />
          <KpiCard
            label="Inflow/Outflow Coverage"
            value={coverageRatio}
            currencyCode={currencyCode}
            variant={coverageRatio >= 1 ? 'ok' : 'danger'}
            icon="trendingUp"
            displayValue={`${coverageRatio.toFixed(2)}x`}
            trendLabel={coverageRatio >= 1 ? 'Positive liquidity coverage' : 'Burn exceeds income'}
          />
        </div>
      ) : null}

      {!loading && !hasData ? (
        <EmptyState
          icon="cashflow"
          title="No cash flow data"
          description={period !== 'all' ? 'No transactions match the selected period.' : 'Record some transactions to see cash flow breakdowns.'}
        >
          {period !== 'all' && (
            <Button variant="secondary" size="sm" onClick={() => setPeriod('all')}>
              Show all
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          {/* Split View: Cash Flow Trajectory + Monthly Breakdown Donut */}
          <div className="cf-split-grid">
            <Card className="page-cf">
              <div className="card__head-flex">
                <CardHeader
                  title="Cash Flow Trajectory"
                  action={
                    <span className="card__header-icon-action" aria-hidden="true" title="Trajectory view">
                      <Icon name="arrowUpRight" size={15} />
                    </span>
                  }
                />
                <span className="cf-trajectory-subtitle">Net velocity &amp; capital movement</span>
              </div>
              <CardBody>
                <CashFlowChart data={chartData} currencyCode={currencyCode} height="100%" minHeight={290} includeCapital />
              </CardBody>
            </Card>

            <Card className="cf-breakdown-card">
              <div className="card__head-flex">
                <CardHeader title="Monthly Breakdown" />
                <div className="cf-tabs" role="tablist" aria-label="Breakdown view">
                  <button
                    type="button"
                    className={`cf-tab-pill${breakdownTab === 'inflow' ? ' cf-tab-pill--active' : ''}`}
                    onClick={() => setBreakdownTab('inflow')}
                    role="tab"
                    aria-selected={breakdownTab === 'inflow'}
                  >
                    Inflow
                  </button>
                  <button
                    type="button"
                    className={`cf-tab-pill${breakdownTab === 'outflow' ? ' cf-tab-pill--active' : ''}`}
                    onClick={() => setBreakdownTab('outflow')}
                    role="tab"
                    aria-selected={breakdownTab === 'outflow'}
                  >
                    Outflow
                  </button>
                </div>
              </div>
              <CardBody>
                <div className="cat-donut">
                  <div className="cat-donut__chart-wrap">
                    <ResponsiveContainer width="100%" height={145}>
                      <PieChart>
                        <Pie
                          data={donutData.slices.filter((s) => s.value > 0).length > 0 ? donutData.slices : [{ name: 'None', value: 1, color: '#334155', pct: 0 }]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={66}
                          paddingAngle={donutData.slices.filter((s) => s.value > 0).length > 1 ? 4 : 0}
                          cornerRadius={5}
                          stroke="none"
                        >
                          {donutData.slices.map((slice) => (
                            <Cell key={slice.name} fill={slice.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: unknown, name: unknown) => [
                            formatCurrency(Number(value) || 0, currencyCode),
                            String(name || 'Amount'),
                          ]}
                          contentStyle={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            color: 'var(--text)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="cat-donut__center" aria-hidden="true">
                      <span className="cat-donut__center-val" title={formatCurrency(donutData.total, currencyCode)}>
                        {formatCompactCurrency(donutData.total, currencyCode)}
                      </span>
                      <span className="cat-donut__center-sub">{donutData.title}</span>
                    </div>
                  </div>

                  <div className="cat-donut__grid">
                    {donutData.slices.map((slice) => (
                      <div key={slice.name} className="cat-donut__item">
                        <div className="cat-donut__item-top">
                          <span className="cat-donut__dot" style={{ backgroundColor: slice.color }} aria-hidden="true" />
                          <span className="cat-donut__name">{slice.name}</span>
                        </div>
                        <div className="cat-donut__item-bottom">
                          <span className="cat-donut__pct">{slice.pct}%</span>
                          <span className="cat-donut__amount">{formatCurrency(slice.value, currencyCode)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="cf-flow-metrics-grid">
                  <div className="dash-health-item">
                    <span className="dash-health-item__label">Net Position</span>
                    <span className={`dash-health-item__value ${netCash >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                      {netCash >= 0 ? `+${formatCurrency(netCash, currencyCode)}` : formatCurrency(netCash, currencyCode)}
                    </span>
                    <span className="dash-health-item__sub">Inflows minus outflows</span>
                  </div>

                  <div className="dash-health-item">
                    <span className="dash-health-item__label">Coverage Ratio</span>
                    <span className={`dash-health-item__value ${coverageRatio >= 1 ? 'cf-positive' : 'cf-negative'}`}>
                      {coverageRatio >= 100 ? '∞' : `${coverageRatio.toFixed(2)}x`}
                    </span>
                    <span className="dash-health-item__sub">Solvency multiplier</span>
                  </div>

                  <div className="dash-health-item">
                    <span className="dash-health-item__label">
                      {breakdownTab === 'inflow' ? 'Primary Inflow' : 'Primary Outflow'}
                    </span>
                    <span className="dash-health-item__value">
                      {breakdownTab === 'inflow'
                        ? (metrics.capitalAdded >= metrics.totalIncome ? 'Capital' : 'Income')
                        : (metrics.totalExpenses >= metrics.totalWithdrawals ? 'Expenses' : 'Withdrawals')}
                    </span>
                    <span className="dash-health-item__sub">
                      {breakdownTab === 'inflow'
                        ? `${Math.max(donutData.slices[0]?.pct || 0, donutData.slices[1]?.pct || 0)}% of total inflows`
                        : `${Math.max(donutData.slices[0]?.pct || 0, donutData.slices[1]?.pct || 0)}% of total outflows`}
                    </span>
                  </div>

                  <div className="dash-health-item">
                    <span className="dash-health-item__label">
                      {breakdownTab === 'inflow' ? 'Vault Retention' : 'Operating Margin'}
                    </span>
                    <span className={`dash-health-item__value ${retentionRate >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                      {retentionRate >= 0 ? `+${retentionRate.toFixed(1)}%` : `${retentionRate.toFixed(1)}%`}
                    </span>
                    <span className="dash-health-item__sub">
                      {breakdownTab === 'inflow' ? 'Gross inflow retained' : 'Operating cash yield'}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Monthly ledger table */}
          <Card>
            <CardHeader title="Monthly Cash Position Breakdown" />
            <CardBody>
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
                      const rowInflow = row.income + (row.capital || 0)
                      const rowOutflow = row.expense + (row.withdrawal || 0)
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
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}

export default CashFlow
