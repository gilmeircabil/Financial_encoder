import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../ui/PageHeader'
import EmptyState from '../ui/EmptyState'
import TransactionForm from '../transactions/TransactionForm'
import MonthlyAmountChart from '../charts/MonthlyAmountChart'
import CategoryProgressList from '../ui/CategoryProgressList'
import { KpiCard } from '../ui/KpiCard'
import { TransactionTable, TransactionColumn, TransactionRow } from '../tables/TransactionTable'
import type { IconName } from '../ui/Icon'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardBody } from '../ui/Card'
import { Select } from '../ui/Input'
import { ConfirmModal } from '../ui/Modal'
import { api, ApiError } from '../../services/api'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency } from '../../utils/currency'
import { useDateRange } from '../../contexts/DateRangeContext'
import { GlobalDateRangeSelector } from '../ui/GlobalDateRangeSelector'
import { computeFinance } from '../../lib/finance'
import { logToMain } from '../../services/logger'
import type {
  CalculationFilter,
  Category,
  CalculationTotals,
  CategoryBreakdown,
  MonthlySummary,
  Transaction,
  TransactionFilters,
  TransactionPage,
  TransactionType,
} from '../../../electron/types/ipc'

export interface LedgerPageProps {
  type: 'income' | 'expense' | 'capital' | 'withdrawal'
  title: string
  description: string
  /** Label for the total KPI card (e.g., "Total Income") */
  statLabel: string
  /** Function to generate subtext from transaction count */
  statSubtext: (count: number) => string
  /** Label for top category KPI card */
  topCategoryLabel: string
  /** Title for category progress list section */
  categoriesTitle: string
  /** Empty message for category progress list */
  emptyCategoryMessage: string
  /** Title for monthly chart */
  chartTitle: string
  /** Title for transactions table */
  recordsTitle: string
  /** Empty state configuration */
  emptyState: {
    icon: IconName
    title: string
    description: string
  }
  /** Modal title for delete confirmation */
  deleteTitle: string
  /** Subject for delete message (e.g., "income record") */
  deleteSubject: string
  /** Success message for export */
  exportSuccessMessage: string
  /** Icon for KPI cards */
  kpiIcon: IconName
  /** Variant for total KPI card */
  totalKpiVariant: 'positive' | 'negative' | 'neutral'
  /** Columns for the transaction table */
  tableColumns: TransactionColumn[]
  /** Transform a transaction to a table row */
  transformRow: (tx: Transaction, idx: number) => TransactionRow
}

export default function LedgerPage({
  type,
  title,
  description: _description,
  statLabel,
  statSubtext,
  topCategoryLabel,
  categoriesTitle,
  emptyCategoryMessage,
  chartTitle,
  recordsTitle,
  emptyState,
  deleteTitle,
  deleteSubject,
  exportSuccessMessage,
  kpiIcon,
  totalKpiVariant,
  tableColumns,
  transformRow,
}: LedgerPageProps): React.JSX.Element {
  const { settings } = useSettings()
  const { success, error: toastError } = useToast()
  const currencyCode = settings?.currency ?? 'PHP'

  const { range, customInvalid } = useDateRange()

  const [totals, setTotals] = useState<CalculationTotals | null>(null)
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([])
  const [monthly, setMonthly] = useState<MonthlySummary[]>([])
  const [pageData, setPageData] = useState<TransactionPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [incomeTab, setIncomeTab] = useState<'category' | 'source'>('category')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  // Load categories for the filter dropdown
  useEffect(() => {
    let cancelled = false
    api.categories.list(type)
      .then((rows) => {
        if (!cancelled) {
          setCategories(rows)
        }
      })
      .catch((err: unknown) => {
        logToMain('error', `load ${type} categories failed`, { message: (err as ApiError).message })
      })
    return () => {
      cancelled = true
    }
  }, [type])

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    if (customInvalid) {
      setLoading(false)
      return
    }

    const calcFilter: CalculationFilter = {
      types: [type],
      ...(range.date_from ? { date_from: range.date_from } : {}),
      ...(range.date_to ? { date_to: range.date_to } : {}),
      ...(categoryFilter ? { category_ids: [Number(categoryFilter)] } : {}),
    }

    const txFilters: TransactionFilters = {
      page,
      page_size: pageSize,
      sort_by: 'date',
      sort_dir: 'desc',
      type: [type],
      ...(range.date_from ? { date_from: range.date_from } : {}),
      ...(range.date_to ? { date_to: range.date_to } : {}),
      ...(categoryFilter ? { category_id: [Number(categoryFilter)] } : {}),
    }

    try {
      const [totalsResult, breakdownResult, monthlyResult, txResult] = await Promise.all([
        api.calculations.totals(calcFilter),
        api.calculations.byCategory(calcFilter),
        api.calculations.monthly(calcFilter),
        api.transactions.list(txFilters),
      ])
      setTotals(totalsResult)
      setBreakdown(breakdownResult)
      setMonthly(monthlyResult)
      setPageData(txResult)
    } catch (err) {
      const message = (err as ApiError).message ?? `${title} data could not be loaded.`
      setError(message)
      logToMain('error', `load ${type} page failed`, { message })
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, range, categoryFilter, customInvalid, type, title])

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

  useEffect(() => {
    setPage(1)
  }, [range, categoryFilter, pageSize])

  const openEdit = (row: TransactionRow): void => {
    const tx = pageData?.transactions.find((t) => t.id === row.id) ?? null
    setEditing(tx)
    setFormOpen(true)
  }

  const confirmDelete = async (): Promise<void> => {
    if (!deleting || deletingBusy) {
      return
    }
    setDeletingBusy(true)
    try {
      await api.transactions.delete(deleting.id)
      success(`${title} transaction "${deleting.description}" deleted.`)
      setDeleting(null)
      await load()
    } catch (err) {
      const message = (err as ApiError).message ?? `The ${deleteSubject} could not be deleted.`
      logToMain('error', `delete ${type} transaction failed`, { message })
      toastError(message)
      setError(message)
      setDeleting(null)
    } finally {
      setDeletingBusy(false)
    }
  }

  const handleExportCsv = async (): Promise<void> => {
    setExporting(true)
    try {
      await api.exports.file({
        format: 'csv',
        filter: {
          types: [type],
          ...(range.date_from ? { date_from: range.date_from } : {}),
          ...(range.date_to ? { date_to: range.date_to } : {}),
          ...(categoryFilter ? { category_ids: [Number(categoryFilter)] } : {}),
        },
      })
      success(exportSuccessMessage)
    } catch (err) {
      if ((err as ApiError).message !== 'Export cancelled.') {
        toastError((err as ApiError).message ?? 'Export failed.')
      }
    } finally {
      setExporting(false)
    }
  }

  const counts = pageData && pageData.total > 0
    ? `${(pageData.page - 1) * pageData.page_size + 1}–${Math.min(pageData.page * pageData.page_size, pageData.total)} of ${pageData.total}`
    : ''
  const totalPages = pageData ? Math.max(1, pageData.total_pages) : 1

  const metrics = computeFinance(totals)
  const totalAmount = type === 'income' ? metrics.totalIncome : type === 'expense' ? metrics.totalExpenses : metrics.netEquity

  const activeMonthsCount = useMemo(() => {
    return monthly.filter((m) => {
      if (type === 'income') return m.income > 0
      if (type === 'expense') return m.expense > 0
      return (m.capital || 0) > 0 || (m.withdrawal || 0) > 0
    }).length
  }, [monthly, type])

  const monthlyAverage = useMemo(() => {
    const activeMonths = monthly.filter((m) => {
      if (type === 'income') return m.income > 0
      if (type === 'expense') return m.expense > 0
      return (m.capital || 0) > 0 || (m.withdrawal || 0) > 0
    })
    if (activeMonths.length === 0) return 0
    const sum = activeMonths.reduce((acc, m) => {
      if (type === 'income') return acc + m.income
      if (type === 'expense') return acc + m.expense
      return acc + (m.capital || 0) - (m.withdrawal || 0)
    }, 0)
    return sum / activeMonths.length
  }, [monthly, type])

  const topCategory = useMemo(() => {
    if (breakdown.length === 0) return null
    return [...breakdown].sort((a, b) => b.total - a.total)[0]
  }, [breakdown])

  const topCategoryPct = useMemo(() => {
    if (!topCategory || totalAmount <= 0) return 0
    return Math.round((Math.abs(topCategory.total) / Math.abs(totalAmount)) * 100)
  }, [topCategory, totalAmount])

  const categoryAverage = useMemo(() => {
    if (breakdown.length === 0) return 0
    return Math.abs(totalAmount) / breakdown.length
  }, [breakdown, totalAmount])

  const renderAllocationInsights = () => (
    <div className="cf-flow-metrics-grid">
      <div className="dash-health-item">
        <span className="dash-health-item__label">Top Concentration</span>
        <span className="dash-health-item__value" title={topCategory ? topCategory.category_name : undefined}>
          {topCategory ? topCategory.category_name : 'None'}
        </span>
        <span className="dash-health-item__sub">
          {topCategory ? `${topCategoryPct}% of total` : 'No recorded activity'}
        </span>
      </div>

      <div className="dash-health-item">
        <span className="dash-health-item__label">Category Mean</span>
        <span className="dash-health-item__value">
          {formatCurrency(categoryAverage, currencyCode)}
        </span>
        <span className="dash-health-item__sub">
          Across {breakdown.length} active {breakdown.length === 1 ? 'category' : 'categories'}
        </span>
      </div>

      <div className="dash-health-item">
        <span className="dash-health-item__label">Active Months</span>
        <span className="dash-health-item__value">
          {activeMonthsCount} {activeMonthsCount === 1 ? 'month' : 'months'}
        </span>
        <span className="dash-health-item__sub">
          With recorded movements
        </span>
      </div>

      <div className="dash-health-item">
        <span className="dash-health-item__label">Monthly Velocity</span>
        <span className="dash-health-item__value">
          {formatCurrency(monthlyAverage, currencyCode)}
        </span>
        <span className="dash-health-item__sub">
          Active month run-rate
        </span>
      </div>
    </div>
  )

  // Transform transactions for the table
  const tableData = useMemo(() => {
    if (!pageData) return []
    return pageData.transactions.map((tx, idx) => transformRow(tx, idx))
  }, [pageData, transformRow])

  return (
    <div className={`page ${type}-page`}>
      <PageHeader
        title={title}
        actions={
          <div className="page-header__actions-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GlobalDateRangeSelector variant="dropdown" />
            <Button
              variant="secondary"
              onClick={handleExportCsv}
              disabled={exporting || !totals || totalAmount === 0}
              title={exporting ? 'Exporting…' : `Export ${title.toLowerCase()} as CSV`}
              aria-label={exporting ? 'Exporting…' : `Export ${title.toLowerCase()} as CSV`}
              icon="download"
              loading={exporting}
            />
          </div>
        }
      />

      {error ? (
        <div role="alert" className="notice notice--error">{error}</div>
      ) : null}

      {/* KPI Cards */}
      {loading && !totals ? (
        <div className="spinner" style={{ margin: '24px auto' }} aria-label={`Loading ${title.toLowerCase()}`} />
      ) : totals ? (
        <div className="dash-summary dash-summary--3">
          <KpiCard
            label={statLabel}
            value={totalAmount}
            currencyCode={currencyCode}
            variant={totalKpiVariant}
            icon={kpiIcon}
            subtitle={statSubtext(totals.count)}
            trendString={totals.count > 0 ? (type === 'income' ? '+100% vs. last month' : type === 'expense' ? '-100% vs. last month' : undefined) : undefined}
            trendDirection={type === 'income' ? 'up' : 'down'}
          />
          <KpiCard
            label="Monthly Average"
            value={monthlyAverage}
            currencyCode={currencyCode}
            variant={type === 'expense' ? 'negative' : type === 'income' ? 'positive' : 'neutral'}
            icon="calendar"
            subtitle={
              activeMonthsCount === 1
                ? '1 month recorded (limited data)'
                : 'Mean per active month'
            }
          />
          <KpiCard
            label={topCategoryLabel}
            value={topCategory?.total ?? 0}
            currencyCode={currencyCode}
            variant={type === 'expense' ? 'negative' : type === 'income' ? 'positive' : 'neutral'}
            icon={type === 'income' ? 'star' : type === 'expense' ? 'tag' : 'scale'}
            subtitle={topCategory?.category_name ?? 'No category data'}
          />
        </div>
      ) : null}

      {/* Tab toggle for Income (By Category / By Source) */}
      {type === 'income' && (
        <div className="tx-tabs" role="tablist" aria-label="Income view" style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className={`tx-tab${incomeTab === 'category' ? ' tx-tab--active' : ''}`}
            role="tab"
            aria-selected={incomeTab === 'category'}
            onClick={() => setIncomeTab('category')}
          >
            By Category
          </button>
          <button
            type="button"
            className={`tx-tab${incomeTab === 'source' ? ' tx-tab--active' : ''}`}
            role="tab"
            aria-selected={incomeTab === 'source'}
            onClick={() => setIncomeTab('source')}
          >
            By Source
          </button>
        </div>
      )}

      {/* Split Charts & Donut Layout */}
      {type === 'income' ? (
        <div className="page-split page-split--chart-left">
          <Card>
            <CardHeader title="Income Trend" />
            <CardBody>
              <MonthlyAmountChart data={monthly} kind="income" currencyCode={currencyCode} height="100%" minHeight={260} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={incomeTab === 'source' ? 'Income by Source' : 'Income by Category'} />
            <CardBody>
              <CategoryProgressList
                items={breakdown}
                currencyCode={currencyCode}
                emptyMessage={emptyCategoryMessage}
                maxItems={8}
                centerLabel="Total"
              />
              {renderAllocationInsights()}
            </CardBody>
          </Card>
        </div>
      ) : type === 'capital' ? (
        <div className="page-split page-split--donut-left">
          <Card>
            <CardHeader title="Capital Allocations" />
            <CardBody>
              <CategoryProgressList
                items={breakdown}
                currencyCode={currencyCode}
                emptyMessage={emptyCategoryMessage}
                fallbackCategories={['Investments', 'Savings', 'Other']}
                maxItems={8}
                centerLabel="Total"
              />
              {renderAllocationInsights()}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Monthly Capital Injections" />
            <CardBody>
              <MonthlyAmountChart data={monthly} kind="capital" currencyCode={currencyCode} height="100%" minHeight={260} />
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="page-split page-split--donut-left">
          <Card>
            <CardHeader title={categoriesTitle} />
            <CardBody>
              <CategoryProgressList
                items={breakdown}
                currencyCode={currencyCode}
                emptyMessage={emptyCategoryMessage}
                maxItems={8}
                centerLabel="Total"
              />
              {renderAllocationInsights()}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={chartTitle} />
            <CardBody>
              <MonthlyAmountChart data={monthly} kind="expense" currencyCode={currencyCode} height="100%" minHeight={260} />
            </CardBody>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader
          title={recordsTitle}
          subtitle={pageData && pageData.total > 0 ? counts : undefined}
          action={
            categories.length > 0 ? (
              <Select
                id={`${type}-cat-filter`}
                label="Category"
                options={[
                  { value: '', label: 'All categories' },
                  ...categories.map((c) => ({ value: String(c.id), label: c.name })),
                ]}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                fullWidth={false}
                style={{ minWidth: '180px' }}
              />
            ) : undefined
          }
        />
        <CardBody>
          {loading && !pageData ? (
            <div className="spinner" style={{ margin: '24px auto' }} aria-label="Loading transactions" />
          ) : !pageData || pageData.transactions.length === 0 ? (
            <EmptyState
              icon={emptyState.icon}
              title={emptyState.title}
              description={emptyState.description}
            />
          ) : (
            <>
              <TransactionTable
                columns={tableColumns}
                data={tableData}
                onEdit={openEdit}
                onDelete={(id) => setDeleting(pageData!.transactions.find(t => t.id === id) || null)}
                showBalanceColumn={false}
              />
              <div className="tx-pagination">
                <div className="tx-pagination__page-size">
                  <span className="field__label">Rows per page:</span>
                  <select
                    className="select-input select-input--sm"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                    aria-label="Rows per page"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="tx-pagination__controls">
                  <span className="tx-pagination__count-text">{counts}</span>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm tx-pagination__btn"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`btn btn--sm tx-pagination__pill${p === page ? ' tx-pagination__pill--active' : ' btn--secondary'}`}
                      onClick={() => setPage(p)}
                      aria-current={p === page ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm tx-pagination__btn"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <TransactionForm
        open={formOpen}
        defaultType={type as TransactionType}
        transaction={editing}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSaved={(saved) => {
          setFormOpen(false)
          setEditing(null)
          setError(null)
          success(editing ? `Updated "${saved.description}"` : `Added "${saved.description}"`)
          void load()
        }}
      />

      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={deleteTitle}
        message={
          <>
            You are about to permanently delete
            {deleting ? <> <strong>"{deleting.description}"</strong> ({formatCurrency(deleting.amount, currencyCode)})</> : ` this ${deleteSubject}`}
            .
          </>
        }
        confirmLabel="Delete Permanently"
        variant="danger"
        busy={deletingBusy}
      />
    </div>
  )
}