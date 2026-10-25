import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmModal from '../../components/ui/ConfirmModal'
import TransactionForm from '../../components/transactions/TransactionForm'
import { Icon } from '../../components/ui/Icon'
import { api, ApiError } from '../../services/api'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency } from '../../utils/currency'
import { formatDate, parseISODate } from '../../utils/dates'
import { useDateRange } from '../../contexts/DateRangeContext'
import { GlobalDateRangeSelector } from '../../components/ui/GlobalDateRangeSelector'
import { logToMain } from '../../services/logger'
import { getCategoryColor } from '../../utils/chart'
import type { Category, Transaction, TransactionFilters, TransactionPage, TransactionType } from '../../../electron/types/ipc'

const PAGE_SIZE = 20
type TransactionFilterType = TransactionType
type SortColumn = 'date' | 'description' | 'amount' | 'type' | 'category'

interface SortState {
  sort_by: SortColumn
  sort_dir: 'asc' | 'desc'
}

const TYPE_FILTER_TABS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Transactions' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expenses' },
  { value: 'capital', label: 'Capital' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
]

const SORTABLE_COLUMNS: Array<{ key: SortColumn; label: string; className?: string }> = [
  { key: 'date', label: 'Date', className: 'tx-cell-date' },
  { key: 'description', label: 'Description', className: 'tx-cell-desc' },
  { key: 'amount', label: 'Amount', className: 'tx-table__amount' },
  { key: 'type', label: 'Type' },
  { key: 'category', label: 'Category', className: 'tx-cell-cat' },
]

function Transactions(): React.JSX.Element {
  const { settings } = useSettings()
  const { success, error: toastError } = useToast()
  const [searchParams] = useSearchParams()
  const currencyCode = settings?.currency ?? 'PHP'
  const dateFormat = settings?.dateFormat ?? 'YYYY-MM-DD'

  const [data, setData] = useState<TransactionPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>({ sort_by: 'date', sort_dir: 'desc' })

  const [categories, setCategories] = useState<Category[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const { range, customInvalid } = useDateRange()
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Running balance toggle
  const [showRunningBalance, setShowRunningBalance] = useState(false)

  // Row selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeletingBusy, setBulkDeletingBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.categories.list()
      .then((rows) => { if (!cancelled) { setCategories(rows) } })
      .catch((err: unknown) => {
        logToMain('error', 'load categories failed', { message: (err as ApiError).message })
      })
    return () => { cancelled = true }
  }, [])

  const load = useCallback(async (): Promise<void> => {
    if (customInvalid) {
      return
    }
    setLoading(true)
    setError(null)
    const filters: TransactionFilters = {
      page,
      page_size: PAGE_SIZE,
      sort_by: sort.sort_by,
      sort_dir: sort.sort_dir,
    }
    if (range.date_from) {
      filters.date_from = range.date_from
    }
    if (range.date_to) {
      filters.date_to = range.date_to
    }
    if (debouncedSearch.trim()) {
      filters.search_term = debouncedSearch.trim()
    }
    if (typeFilter) {
      filters.type = [typeFilter as TransactionFilterType]
    }
    if (categoryFilter) {
      filters.category_id = [Number(categoryFilter)]
    }
    try {
      const result = await api.transactions.list(filters)
      setData(result)
    } catch (err) {
      const message = (err as ApiError).message ?? 'Transactions could not be loaded.'
      setError(message)
      logToMain('error', 'load transactions failed', { message })
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, sort, typeFilter, categoryFilter, range, customInvalid])

  useEffect(() => {
    void load()
  }, [load])

  // Clear row selections when page, search, or filters change
  useEffect(() => {
    setSelectedIds(new Set())
  }, [page, debouncedSearch, typeFilter, categoryFilter, range])

  // Auto-refresh when transaction-saved event is dispatched
  useEffect(() => {
    const handleSaved = () => {
      void load()
    }
    window.addEventListener('transaction-saved', handleSaved)
    return () => window.removeEventListener('transaction-saved', handleSaved)
  }, [load])

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(handle)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q !== null) {
      setSearch(q)
      setPage(1)
    }
  }, [searchParams])

  const toggleSort = (by: SortColumn): void => {
    setPage(1)
    setSort((prev) => (prev.sort_by === by
      ? { sort_by: by, sort_dir: prev.sort_dir === 'asc' ? 'desc' : 'asc' }
      : { sort_by: by, sort_dir: 'asc' }))
  }

  const sortArrow = (by: SortColumn): React.JSX.Element => {
    if (sort.sort_by !== by) {
      return <span className="tx-table__sort-icon tx-table__sort-icon--idle" aria-hidden="true">↕</span>
    }
    return (
      <span className="tx-table__sort-icon tx-table__sort-icon--active" aria-hidden="true">
        {sort.sort_dir === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  const hasActiveFilters = Boolean(search || typeFilter || categoryFilter)

  const resetFilters = (): void => {
    setSearch('')
    setTypeFilter('')
    setCategoryFilter('')
    setPage(1)
  }

  const openEdit = (transaction: Transaction): void => {
    setEditing(transaction)
    setFormOpen(true)
  }

  // Row selection helpers
  const transactions = data?.transactions ?? []
  const allOnPageSelected = transactions.length > 0 && transactions.every((t) => selectedIds.has(t.id))
  const someOnPageSelected = transactions.some((t) => selectedIds.has(t.id)) && !allOnPageSelected

  const toggleSelectRow = (id: number): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = (): void => {
    if (allOnPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const t of transactions) {
          next.delete(t.id)
        }
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const t of transactions) {
          next.add(t.id)
        }
        return next
      })
    }
  }

  // Single delete
  const confirmDelete = async (): Promise<void> => {
    if (!deleting || deletingBusy) {
      return
    }
    setDeletingBusy(true)
    try {
      await api.transactions.delete(deleting.id)
      success(`Transaction "${deleting.description}" deleted.`)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(deleting.id)
        return next
      })
      setDeleting(null)
      await load()
    } catch (err) {
      const message = (err as ApiError).message ?? 'The transaction could not be deleted.'
      logToMain('error', 'delete transaction failed', { message })
      toastError(message)
      setError(message)
      setDeleting(null)
    } finally {
      setDeletingBusy(false)
    }
  }

  // Bulk delete
  const confirmBulkDelete = async (): Promise<void> => {
    if (selectedIds.size === 0 || bulkDeletingBusy) {
      return
    }
    setBulkDeletingBusy(true)
    try {
      const ids = Array.from(selectedIds)
      for (const id of ids) {
        await api.transactions.delete(id)
      }
      success(`Successfully deleted ${ids.length} transaction${ids.length === 1 ? '' : 's'}.`)
      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
      await load()
    } catch (err) {
      const message = (err as ApiError).message ?? 'Some transactions could not be deleted.'
      logToMain('error', 'bulk delete failed', { message })
      toastError(message)
    } finally {
      setBulkDeletingBusy(false)
    }
  }

  // Running balance calculation for rows on current page
  const runningBalances = useMemo<number[]>(() => {
    if (!data?.transactions || data.transactions.length === 0) return []
    let cumulative = 0
    const deltas = data.transactions.map((tx) => {
      const isOutflow = tx.type === 'expense' || tx.type === 'withdrawal' || tx.type === 'liability'
      return isOutflow ? -tx.amount : tx.amount
    })
    if (sort.sort_dir === 'desc') {
      const reversedDeltas = [...deltas].reverse()
      const reversedCumul: number[] = []
      for (const d of reversedDeltas) {
        cumulative += d
        reversedCumul.push(cumulative)
      }
      return reversedCumul.reverse()
    } else {
      const cumul: number[] = []
      for (const d of deltas) {
        cumulative += d
        cumul.push(cumulative)
      }
      return cumul
    }
  }, [data?.transactions, sort.sort_dir])

  const handleExportCsv = async (): Promise<void> => {
    setExporting(true)
    try {
      await api.exports.file({
        format: 'csv',
        filter: {
          ...(range.date_from ? { date_from: range.date_from } : {}),
          ...(range.date_to ? { date_to: range.date_to } : {}),
          ...(typeFilter ? { types: [typeFilter as TransactionType] } : {}),
          ...(categoryFilter ? { category_ids: [Number(categoryFilter)] } : {}),
        },
      })
      success('Transactions exported to CSV!')
    } catch (err) {
      if ((err as ApiError).message !== 'Export cancelled.') {
        toastError((err as ApiError).message ?? 'Export failed.')
      }
    } finally {
      setExporting(false)
    }
  }

  const totalPages = data ? Math.max(1, data.total_pages) : 1
  const counts = data
    ? `${(data.page - 1) * data.page_size + (data.transactions.length > 0 ? 1 : 0)}–${Math.min(data.page * data.page_size, data.total)} of ${data.total}`
    : ''

  return (
    <div className="page transactions-page">
      <PageHeader
        title="Transactions"
        description="Comprehensive ledger. Search, filter, inspect, and manage every financial record."
        actions={
          <div className="tx-header-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleExportCsv}
              disabled={exporting || !data || data.total === 0}
              title="Export current view as CSV"
            >
              <Icon name="download" size={15} />
              <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
            </button>
          </div>
        }
      />

      {/* Quick Filter Tabs */}
      <div className="tx-tabs" role="tablist" aria-label="Transaction type filter">
        {TYPE_FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`tx-tab${typeFilter === tab.value ? ' tx-tab--active' : ''}`}
            role="tab"
            aria-selected={typeFilter === tab.value}
            onClick={() => {
              setTypeFilter(tab.value)
              setPage(1)
            }}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="card tx-toolbar">
        <div className="tx-search">
          <Icon name="search" size={16} />
          <input
            id="tx-search"
            type="search"
            className="text-input"
            placeholder="Search description, category, or notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="tx-search__clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        <label className="field__label tx-filter" htmlFor="tx-filter-category">
          <span className="sr-only">Filter by category</span>
          <select
            id="tx-filter-category"
            className="select-input"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name} ({c.type})</option>
            ))}
          </select>
        </label>

        <GlobalDateRangeSelector />

        {/* Toggle Running Balance column */}
        <button
          type="button"
          className={`btn btn--sm ${showRunningBalance ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setShowRunningBalance((prev) => !prev)}
          title="Toggle cumulative running balance column"
          aria-pressed={showRunningBalance}
        >
          <Icon name="wallet" size={13} />
          <span>Running Balance</span>
        </button>

        {hasActiveFilters ? (
          <button type="button" className="btn btn--secondary btn--sm" onClick={resetFilters}>
            <Icon name="x" size={13} />
            <span>Reset filters</span>
          </button>
        ) : null}

        {data && (
          <div className="tx-count-tag">
            <span>{data.total.toLocaleString()} {data.total === 1 ? 'record' : 'records'}</span>
          </div>
        )}
      </div>

      {/* Bulk selection action bar */}
      {selectedIds.size > 0 && (
        <div className="tx-bulk-bar" role="region" aria-label="Bulk actions">
          <span className="tx-bulk-bar__count">
            <strong>{selectedIds.size}</strong> {selectedIds.size === 1 ? 'transaction' : 'transactions'} selected
          </span>
          <div className="tx-bulk-bar__actions">
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Icon name="trash" size={13} />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {customInvalid ? (
        <div role="alert" className="notice notice--error">
          The start date must be on or before the end date.
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="notice notice--error">{error}</div>
      ) : null}

      <div className="card tx-card-container">
        {loading && !data ? (
          <div className="spinner" style={{ margin: '36px auto' }} aria-label="Loading transactions" />
        ) : !data || data.transactions.length === 0 ? (
          <EmptyState
            icon="transactions"
            title={hasActiveFilters ? 'No matching transactions' : 'No transactions recorded'}
            description={
              hasActiveFilters
                ? 'Try broadening your search term or selecting a different filter.'
                : 'Get started by creating your first transaction, or import your records.'
            }
          >
            {hasActiveFilters ? (
              <button type="button" className="btn btn--secondary" onClick={resetFilters}>
                Clear active filters
              </button>
            ) : null}
          </EmptyState>
        ) : (
          <div className="tx-table-wrap">
            <table className="tx-table">
              <thead>
                <tr>
                  <th className="tx-cell-check">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someOnPageSelected
                      }}
                      onChange={toggleSelectAll}
                      aria-label="Select all transactions on page"
                    />
                  </th>
                  {SORTABLE_COLUMNS.map((col) => (
                    <th key={col.key} className={col.className}>
                      <button
                        type="button"
                        className={`tx-table__sort ${sort.sort_by === col.key ? 'tx-table__sort--active' : ''}`}
                        onClick={() => toggleSort(col.key)}
                        aria-label={`Sort by ${col.label}`}
                      >
                        <span>{col.label}</span>
                        {sortArrow(col.key)}
                      </button>
                    </th>
                  ))}
                  {showRunningBalance && (
                    <th className="tx-table__amount">Running Balance</th>
                  )}
                  <th className="tx-table__actions-head">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx, idx) => {
                  const isOutflow = tx.type === 'expense' || tx.type === 'withdrawal' || tx.type === 'liability'
                  const isSelected = selectedIds.has(tx.id)
                  const rowBalance = runningBalances[idx] ?? 0

                  return (
                    <tr key={tx.id} className={`tx-row ${isSelected ? 'tx-row--selected' : ''}`}>
                      <td className="tx-cell-check">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(tx.id)}
                          aria-label={`Select transaction ${tx.description}`}
                        />
                      </td>
                      <td className="tx-cell-date">
                        <time dateTime={tx.date}>{formatDate(parseISODate(tx.date), dateFormat)}</time>
                      </td>
                      <td className="tx-cell-desc">
                        <span className="tx-table__desc">{tx.description}</span>
                        {tx.notes ? <span className="tx-table__notes">{tx.notes}</span> : null}
                      </td>
                      <td className={`tx-table__amount ${isOutflow ? 'cf-negative' : 'cf-positive'}`}>
                        <span className="tx-amount-badge">
                          {isOutflow ? '-' : '+'}{formatCurrency(tx.amount, currencyCode)}
                        </span>
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
                      {showRunningBalance && (
                        <td className={`tx-table__amount ${rowBalance >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                          <span className="tx-amount-badge">
                            {formatCurrency(rowBalance, currencyCode)}
                          </span>
                        </td>
                      )}
                      <td className="tx-table__actions">
                        <button
                          type="button"
                          className="btn btn--sm tx-action-btn tx-action-btn--edit"
                          onClick={() => openEdit(tx)}
                          title="Edit transaction"
                        >
                          <Icon name="edit" size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm tx-action-btn tx-action-btn--delete"
                          onClick={() => setDeleting(tx)}
                          title="Delete transaction"
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
                  Page {data.page} of {totalPages}
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

      {/* Delete confirmation modal for single transaction */}
      <ConfirmModal
        open={deleting !== null}
        title="Delete Transaction"
        message={
          deleting ? (
            <p>
              Are you sure you want to permanently delete <strong>"{deleting.description}"</strong> (
              {formatCurrency(deleting.amount, currencyCode)})? This action cannot be undone.
            </p>
          ) : null
        }
        confirmLabel="Delete Permanently"
        danger
        busy={deletingBusy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />

      {/* Bulk delete confirmation modal */}
      <ConfirmModal
        open={bulkDeleteOpen}
        title="Delete Multiple Transactions"
        message={
          <p>
            Are you sure you want to permanently delete <strong>{selectedIds.size}</strong> selected transactions? This action cannot be undone.
          </p>
        }
        confirmLabel={`Delete ${selectedIds.size} Transactions`}
        danger
        busy={bulkDeletingBusy}
        onConfirm={() => void confirmBulkDelete()}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  )
}

export default Transactions
