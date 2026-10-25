import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import TypeToConfirmModal from '../../components/ui/TypeToConfirmModal'
import TransactionForm from '../../components/transactions/TransactionForm'
import MonthlyAmountChart from '../../components/charts/MonthlyAmountChart'
import CategoryProgressList from '../../components/ui/CategoryProgressList'
import { Icon } from '../../components/ui/Icon'
import { api, ApiError } from '../../services/api'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency, formatCompactCurrency } from '../../utils/currency'
import { getCategoryColor } from '../../utils/chart'
import { useDateRange } from '../../contexts/DateRangeContext'
import { GlobalDateRangeSelector } from '../../components/ui/GlobalDateRangeSelector'
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
} from '../../../electron/types/ipc'

const CAPITAL_TYPES = ['capital', 'withdrawal'] as const
const PAGE_SIZE = 20

function Capital(): React.JSX.Element {
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
    api.categories.list()
      .then((rows) => {
        if (!cancelled) {
          setCategories(rows.filter((c) => c.type === 'capital' || c.type === 'withdrawal'))
        }
      })
      .catch((err: unknown) => {
        logToMain('error', 'load capital categories failed', { message: (err as ApiError).message })
      })
    return () => { cancelled = true }
  }, [])

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    if (customInvalid) {
      setLoading(false)
      return
    }

    const calcFilter: CalculationFilter = {
      types: [...CAPITAL_TYPES],
      ...(range.date_from ? { date_from: range.date_from } : {}),
      ...(range.date_to ? { date_to: range.date_to } : {}),
      ...(categoryFilter ? { category_ids: [Number(categoryFilter)] } : {}),
    }

    const txFilters: TransactionFilters = {
      page,
      page_size: PAGE_SIZE,
      sort_by: 'date',
      sort_dir: 'desc',
      type: [...CAPITAL_TYPES],
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
      const message = (err as ApiError).message ?? 'Capital data could not be loaded.'
      setError(message)
      logToMain('error', 'load capital page failed', { message })
    } finally {
      setLoading(false)
    }
  }, [page, range, categoryFilter, customInvalid])

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
      success(`Capital movement "${deleting.description}" deleted.`)
      setDeleting(null)
      await load()
    } catch (err) {
      const message = (err as ApiError).message ?? 'The transaction could not be deleted.'
      logToMain('error', 'delete capital transaction failed', { message })
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
          types: [...CAPITAL_TYPES],
          ...(range.date_from ? { date_from: range.date_from } : {}),
          ...(range.date_to ? { date_to: range.date_to } : {}),
          ...(categoryFilter ? { category_ids: [Number(categoryFilter)] } : {}),
        },
      })
      success('Capital ledger exported to CSV!')
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
  const netCapital = metrics.netEquity
  const retention = metrics.capitalAdded > 0 ? (metrics.netEquity / metrics.capitalAdded) * 100 : 0

  return (
    <div className="page capital-page">
      <PageHeader
        title="Capital &amp; Equity"
        description="Monitor owner investments, contributions, withdrawals and equity reserves."
        actions={
          <div className="page-header__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleExportCsv}
              disabled={exporting || !totals || totals.count === 0}
              title="Export capital ledger as CSV"
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
          <label className="field__label page-cat-filter" htmlFor="capital-cat-filter">
            <span className="sr-only">Filter by category</span>
            <select
              id="capital-cat-filter"
              className="select-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name} ({c.type})</option>
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
        <div className="spinner" style={{ margin: '24px auto' }} aria-label="Loading capital" />
      ) : totals ? (
        <div className="dash-summary">
          <div className="card stat-card stat-card--capital">
            <div className="stat-card__head">
              <span className="stat-card__label">Net Equity Balance</span>
              <div className="stat-card__icon" aria-hidden="true">
                <Icon name="capital" size={17} />
              </div>
            </div>
            <span className={`stat-card__value ${netCapital >= 0 ? 'stat-card__value--positive' : 'stat-card__value--negative'}`} title={formatCurrency(netCapital, currencyCode)}>{formatCompactCurrency(netCapital, currencyCode)}</span>
            <div className="stat-card__footer">
              <span className="stat-card__badge stat-card__badge--ok">
                <span>{retention.toFixed(1)}% retained</span>
              </span>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-card__head">
              <span className="stat-card__label">Capital Added</span>
              <div className="stat-card__icon" aria-hidden="true">
                <Icon name="arrowUp" size={17} />
              </div>
            </div>
            <span className="stat-card__value stat-card__value--positive" title={formatCurrency(metrics.capitalAdded, currencyCode)}>{formatCompactCurrency(metrics.capitalAdded, currencyCode)}</span>
            <div className="stat-card__footer">
              <span className="stat-card__subtext">Contributions &amp; injections</span>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-card__head">
              <span className="stat-card__label">Total Withdrawn</span>
              <div className="stat-card__icon" aria-hidden="true">
                <Icon name="arrowDown" size={17} />
              </div>
            </div>
            <span className="stat-card__value stat-card__value--negative" title={formatCurrency(metrics.totalWithdrawals, currencyCode)}>{formatCompactCurrency(metrics.totalWithdrawals, currencyCode)}</span>
            <div className="stat-card__footer">
              <span className="stat-card__subtext">Owner disbursements</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Split: Category Breakdown + Monthly Chart */}
      <div className="page-split">
        <div className="card">
          <h3 className="card__title">Capital Allocations</h3>
          <CategoryProgressList
            items={breakdown}
            currencyCode={currencyCode}
            emptyMessage="No capital category movements in range."
            maxItems={8}
          />
        </div>

        <div className="card">
          <h3 className="card__title">Monthly Capital Injections</h3>
          <MonthlyAmountChart data={monthly} kind="capital" currencyCode={currencyCode} height={260} />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card__head-flex">
          <h3 className="card__title">Capital Records</h3>
          {pageData && pageData.total > 0 && (
            <span className="field__hint">{counts}</span>
          )}
        </div>

        {loading && !pageData ? (
          <div className="spinner" style={{ margin: '24px auto' }} aria-label="Loading transactions" />
        ) : !pageData || pageData.transactions.length === 0 ? (
          <EmptyState
            icon="capital"
            title="No capital records"
            description="Log equity investments, capital additions, or owner withdrawals."
          />
        ) : (
          <div className="tx-table-wrap">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th className="tx-table__amount">Amount</th>
                  <th className="tx-table__actions-head">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.transactions.map((tx) => {
                  const isWithdrawal = tx.type === 'withdrawal'
                  return (
                    <tr key={tx.id} className="tx-row">
                      <td className="tx-cell-date">{formatDate(parseISODate(tx.date), dateFormat)}</td>
                      <td className="tx-cell-desc">
                        <span className="tx-table__desc">{tx.description}</span>
                        {tx.notes ? <span className="tx-table__notes">{tx.notes}</span> : null}
                      </td>
                      <td>
                        <span className={`badge badge--${tx.type}`}>{tx.type}</span>
                      </td>
                      <td className="tx-cell-cat">
                        <span className="tx-category-tag">
                          <span
                            className="tx-category-dot"
                            style={{ backgroundColor: getCategoryColor(tx.category_name || '') }}
                            aria-hidden="true"
                          />
                          <span>{tx.category_name}</span>
                        </span>
                      </td>
                      <td className={`tx-table__amount ${isWithdrawal ? 'cf-negative' : 'cf-positive'}`}>
                        <span className="tx-amount-badge">
                          {isWithdrawal ? '-' : '+'}{formatCurrency(tx.amount, currencyCode)}
                        </span>
                      </td>
                      <td className="tx-table__actions">
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm tx-action-btn"
                          onClick={() => openEdit(tx)}
                          title="Edit capital"
                        >
                          <Icon name="edit" size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm tx-action-btn"
                          onClick={() => setDeleting(tx)}
                          title="Delete capital"
                        >
                          <Icon name="trash" size={13} />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
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
        defaultType="capital"
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
        title="Delete Capital Record"
        message={
          <>
            You are about to permanently delete
            {deleting ? <> <strong>"{deleting.description}"</strong> ({formatCurrency(deleting.amount, currencyCode)})</> : ' this capital record'}
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

export default Capital