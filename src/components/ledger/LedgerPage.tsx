import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../ui/PageHeader'
import EmptyState from '../ui/EmptyState'
import TypeToConfirmModal from '../ui/TypeToConfirmModal'
import TransactionForm from '../transactions/TransactionForm'
import MonthlyAmountChart from '../charts/MonthlyAmountChart'
import CategoryProgressList from '../ui/CategoryProgressList'
import { Icon, type IconName } from '../ui/Icon'
import { api, ApiError } from '../../services/api'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency, formatCompactCurrency } from '../../utils/currency'
import { useDateRange } from '../../contexts/DateRangeContext'
import { GlobalDateRangeSelector } from '../ui/GlobalDateRangeSelector'
import { computeFinance } from '../../lib/finance'
import { formatDate, parseISODate } from '../../utils/dates'

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

const PAGE_SIZE = 20

export interface LedgerPageProps {
  type: 'income' | 'expense'
  pageClass: string
  title: string
  description: string
  addLabel?: string
  statLabel: string
  statSubtext: (count: number) => string
  topCategoryLabel: string
  categoriesTitle: string
  emptyCategoryMessage: string
  chartTitle: string
  recordsTitle: string
  emptyState: {
    icon: IconName
    title: string
    description: string
    buttonText: string
  }
  amountPrefix: string
  amountClass: string
  deleteTitle: string
  deleteSubject: string
  exportSuccessMessage: string
}

export default function LedgerPage({
  type,
  pageClass,
  title,
  description,
  statLabel,
  statSubtext,
  topCategoryLabel,
  categoriesTitle,
  emptyCategoryMessage,
  chartTitle,
  recordsTitle,
  emptyState,
  amountPrefix,
  amountClass,
  deleteTitle,
  deleteSubject,
  exportSuccessMessage,
}: LedgerPageProps): React.JSX.Element {
  const { settings } = useSettings()
  const { success, error: toastError } = useToast()
  const currencyCode = settings?.currency ?? 'PHP'
  const dateFormat = settings?.dateFormat ?? 'YYYY-MM-DD'

  const { range, customInvalid } = useDateRange()

  const [totals, setTotals] = useState<CalculationTotals | null>(null)
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([])
  const [monthly, setMonthly] = useState<MonthlySummary[]>([])
  const [pageData, setPageData] = useState<TransactionPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryFilter, setCategoryFilter] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  

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
      page_size: PAGE_SIZE,
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
  }, [page, range, categoryFilter, customInvalid, type, title])

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
  }, [range, categoryFilter])

  const openEdit = (tx: Transaction): void => {
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

  const totalPages = pageData ? Math.max(1, pageData.total_pages) : 1
  const counts = pageData
    ? `${(pageData.page - 1) * pageData.page_size + (pageData.transactions.length > 0 ? 1 : 0)}–${Math.min(pageData.page * pageData.page_size, pageData.total)} of ${pageData.total}`
    : ''

  const metrics = computeFinance(totals)
  const totalAmount = type === 'income' ? metrics.totalIncome : metrics.totalExpenses

  const monthlyAverage = useMemo(() => {
    const activeMonths = monthly.filter((m) => (type === 'income' ? m.income : m.expense) > 0)
    if (activeMonths.length === 0) return 0
    const sum = activeMonths.reduce((acc, m) => acc + (type === 'income' ? m.income : m.expense), 0)
    return sum / activeMonths.length
  }, [monthly, type])

  const topCategory = useMemo(() => {
    if (breakdown.length === 0) return null
    return [...breakdown].sort((a, b) => b.total - a.total)[0]
  }, [breakdown])

  return (
    <div className={`page ${pageClass}`}>
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="page-header__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleExportCsv}
              disabled={exporting || !totals || totalAmount === 0}
              title={`Export ${title.toLowerCase()} as CSV`}
            >
              <Icon name="download" size={15} />
              <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
            </button>
          </div>
        }
      />

      <div className="card page-toolbar">
        <GlobalDateRangeSelector />
        {categories.length > 0 && (
          <label className="field__label page-cat-filter" htmlFor={`${type}-cat-filter`}>
            <span className="sr-only">Filter by category</span>
            <select
              id={`${type}-cat-filter`}
              className="select-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error ? (
        <div role="alert" className="notice notice--error">{error}</div>
      ) : null}

      {/* Modern KPI Cards */}
      {loading && !totals ? (
        <div className="spinner" style={{ margin: '24px auto' }} aria-label={`Loading ${title.toLowerCase()}`} />
      ) : totals ? (
        <div className="dash-summary">
          <div className={`card stat-card stat-card--${type}`}>
            <div className="stat-card__head">
              <span className="stat-card__label">{statLabel}</span>
              <div className="stat-card__icon" aria-hidden="true">
                <Icon name={type === 'income' ? 'arrowUp' : 'arrowDown'} size={17} />
              </div>
            </div>
            <span className={`stat-card__value ${type === 'income' ? 'stat-card__value--positive' : 'stat-card__value--negative'}`} title={formatCurrency(totalAmount, currencyCode)}>{formatCompactCurrency(totalAmount, currencyCode)}</span>
            <div className="stat-card__footer">
              <span className="stat-card__subtext">{statSubtext(totals.count)}</span>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-card__head">
              <span className="stat-card__label">Monthly Average</span>
              <div className="stat-card__icon" aria-hidden="true">
                <Icon name="calendar" size={17} />
              </div>
            </div>
            <span className="stat-card__value" title={formatCurrency(monthlyAverage, currencyCode)}>{formatCompactCurrency(monthlyAverage, currencyCode)}</span>
            <div className="stat-card__footer">
              <span className="stat-card__subtext">Mean per active month</span>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-card__head">
              <span className="stat-card__label">{topCategoryLabel}</span>
              <div className="stat-card__icon" aria-hidden="true">
                <Icon name="tag" size={17} />
              </div>
            </div>
            <span className="stat-card__value" style={{ fontSize: '20px' }}>
              {topCategory ? topCategory.category_name : '—'}
            </span>
            <div className="stat-card__footer">
              {topCategory ? (
                <span className={`stat-card__badge ${type === 'income' ? 'stat-card__badge--ok' : 'stat-card__badge--danger'}`}>
                  {formatCurrency(topCategory.total, currencyCode)}
                </span>
              ) : (
                <span className="stat-card__subtext">No category data</span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Chart + Category Progress List */}
      <div className="page-split">
        <div className="card">
          <h3 className="card__title">{categoriesTitle}</h3>
          <CategoryProgressList
            items={breakdown}
            currencyCode={currencyCode}
            emptyMessage={emptyCategoryMessage}
            maxItems={8}
            centerLabel={title}
          />
        </div>

        <div className="card">
          <h3 className="card__title">{chartTitle}</h3>
          <MonthlyAmountChart data={monthly} kind={type} currencyCode={currencyCode} height={260} />
        </div>
      </div>

      {/* Transactions List */}
      <div className="card">
        <div className="card__head-flex">
          <h3 className="card__title">{recordsTitle}</h3>
          {pageData && pageData.total > 0 && (
            <span className="field__hint">{counts}</span>
          )}
        </div>

        {loading && !pageData ? (
          <div className="spinner" style={{ margin: '24px auto' }} aria-label="Loading transactions" />
        ) : !pageData || pageData.transactions.length === 0 ? (
          <EmptyState
            icon={emptyState.icon}
            title={emptyState.title}
            description={emptyState.description}
          />
        ) : (
          <div className="tx-table-wrap">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th className="tx-table__amount">Amount</th>
                  <th className="tx-table__actions-head">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.transactions.map((tx) => (
                  <tr key={tx.id} className="tx-row">
                    <td className="tx-cell-date">{formatDate(parseISODate(tx.date), dateFormat)}</td>
                    <td className="tx-cell-desc">
                      <span className="tx-table__desc">{tx.description}</span>
                      {tx.notes ? <span className="tx-table__notes">{tx.notes}</span> : null}
                    </td>
                    <td className="tx-cell-cat">
                      <span className="tx-category-tag">
                        <span className="tx-category-dot" aria-hidden="true" />
                        <span>{tx.category_name}</span>
                      </span>
                    </td>
                    <td className={`tx-table__amount ${amountClass}`}>
                      <span className="tx-amount-badge">
                        {amountPrefix}{formatCurrency(tx.amount, currencyCode)}
                      </span>
                    </td>
                    <td className="tx-table__actions">
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm tx-action-btn"
                        onClick={() => openEdit(tx)}
                        title={`Edit ${type}`}
                      >
                        <Icon name="edit" size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger btn--sm tx-action-btn"
                        onClick={() => setDeleting(tx)}
                        title={`Delete ${type}`}
                      >
                        <Icon name="trash" size={13} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="tx-pagination">
              <span className="field__hint">{counts}</span>
              <div className="tx-pagination__controls">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹ Prev
                </button>
                <span className="tx-pagination__page-num">
                  Page {pageData.page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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

      <TypeToConfirmModal
        open={deleting !== null}
        title={deleteTitle}
        message={
          <>
            You are about to permanently delete
            {deleting ? <> <strong>"{deleting.description}"</strong> ({formatCurrency(deleting.amount, currencyCode)})</> : ` this ${deleteSubject}`}
            .
          </>
        }
        confirmLabel="Delete Permanently"
        requiredText="DELETE"
        busy={deletingBusy}
        busyLabel="Deleting…"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
