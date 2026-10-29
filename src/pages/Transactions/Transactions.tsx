import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import TransactionForm from '../../components/transactions/TransactionForm'
import { Icon } from '../../components/ui/Icon'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/Modal'
import { TransactionTable, TransactionColumn, TransactionRow } from '../../components/tables/TransactionTable'
import { api, ApiError } from '../../services/api'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency } from '../../utils/currency'
import { useDateRange } from '../../contexts/DateRangeContext'
import { GlobalDateRangeSelector } from '../../components/ui/GlobalDateRangeSelector'
import { logToMain } from '../../services/logger'
import type { Category, Transaction, TransactionFilters, TransactionPage, TransactionType } from '../../../electron/types/ipc'

type TransactionFilterType = TransactionType
type SortColumn = 'date' | 'description' | 'amount' | 'type' | 'category'

const PRIMARY_TYPE_TABS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expenses' },
  { value: 'capital', label: 'Capital' },
]

const SECONDARY_TYPE_TABS: Array<{ value: string; label: string }> = [
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
]

const SORTABLE_COLUMNS: TransactionColumn[] = [
  { key: 'date', label: 'Date', className: 'tx-cell-date', sortable: true },
  { key: 'description', label: 'Description', className: 'tx-cell-desc', sortable: true },
  { key: 'amount', label: 'Amount', className: 'tx-table__amount', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'category', label: 'Category', className: 'tx-cell-cat', sortable: true },
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
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState<SortColumn>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

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
  const [moreTypesOpen, setMoreTypesOpen] = useState(false)

  useEffect(() => {
    if (!moreTypesOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.tx-more-types-dropdown')) {
        setMoreTypesOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreTypesOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [moreTypesOpen])

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
      page_size: pageSize,
      sort_by: sortBy as TransactionFilters['sort_by'],
      sort_dir: sortDir,
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
  }, [page, pageSize, debouncedSearch, sortBy, sortDir, typeFilter, categoryFilter, range, customInvalid])

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
    setSortBy((prev: SortColumn): SortColumn => (prev === by ? by : by))
    setSortDir((prev) => (sortBy === by ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'))
    setSortBy(by)
  }

  const hasActiveFilters = Boolean(search || typeFilter || categoryFilter)

  const resetFilters = (): void => {
    setSearch('')
    setTypeFilter('')
    setCategoryFilter('')
    setPage(1)
  }

  const openEdit = (row: TransactionRow): void => {
    const tx = data?.transactions.find((t) => t.id === row.id) ?? null
    setEditing(tx)
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
    if (sortDir === 'desc') {
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
  }, [data?.transactions, sortDir])

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

  // Transform transactions for the shared TransactionTable
  const tableData = useMemo<TransactionRow[]>(() => {
    if (!data) return []
    return data.transactions.map((tx, idx) => ({
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: tx.type === 'expense' || tx.type === 'withdrawal' || tx.type === 'liability' ? -tx.amount : tx.amount,
      type: tx.type,
      category_name: tx.category_name,
      cumulativeBalance: runningBalances[idx],
      notes: tx.notes,
    }))
  }, [data, runningBalances])

  return (
    <div className="page transactions-page">
      <PageHeader
        title="Transactions"
        actions={
          <div className="tx-header-actions">
            <button
              type="button"
              className="btn btn--secondary btn--icon-only"
              onClick={handleExportCsv}
              disabled={exporting || !data || data.total === 0}
              title={exporting ? 'Exporting…' : 'Export current view as CSV'}
              aria-label={exporting ? 'Exporting…' : 'Export current view as CSV'}
            >
              <Icon name="download" size={15} />
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
              title="Add a new transaction"
            >
              <Icon name="plus" size={15} />
              <span>Add Transaction</span>
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="tx-toolbar">
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

        <div className="tx-filter">
          <select
            id="tx-filter-category"
            className="select-input"
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        <GlobalDateRangeSelector variant="dropdown" />

        <label className="tx-running-balance-checkbox" title="Toggle cumulative running balance column">
          <input
            type="checkbox"
            checked={showRunningBalance}
            onChange={(e) => setShowRunningBalance(e.target.checked)}
          />
          <span>Running Balance</span>
        </label>

        {hasActiveFilters && (
          <Button variant="secondary" size="sm" onClick={resetFilters} icon="x">
            Reset filters
          </Button>
        )}

        {data && (
          <span className="tx-count-tag">
            {data.total.toLocaleString()} {data.total === 1 ? 'record' : 'records'}
          </span>
        )}
      </div>

      {/* Quick Filter Tabs */}
      <div className="tx-tabs" role="tablist" aria-label="Transaction type filter">
        {PRIMARY_TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`tx-tab${typeFilter === tab.value ? ' tx-tab--active' : ''}`}
            role="tab"
            aria-selected={typeFilter === tab.value}
            onClick={() => {
              setTypeFilter(tab.value)
              setPage(1)
              setMoreTypesOpen(false)
            }}
          >
            {tab.label}
          </button>
        ))}

        <div className="tx-more-types-dropdown app-dropdown">
          <button
            type="button"
            className={`tx-tab${SECONDARY_TYPE_TABS.some((t) => t.value === typeFilter) ? ' tx-tab--active' : ''}`}
            onClick={() => setMoreTypesOpen((o) => !o)}
            aria-expanded={moreTypesOpen}
            aria-haspopup="true"
          >
            <span>
              {SECONDARY_TYPE_TABS.find((t) => t.value === typeFilter)?.label ?? 'More'}
            </span>
            <span style={{ fontSize: '10px', marginLeft: '5px' }}>▾</span>
          </button>

          {moreTypesOpen && (
            <div className="app-dropdown__menu" style={{ left: 0, right: 'auto', minWidth: '140px', zIndex: 50 }}>
              {SECONDARY_TYPE_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`app-dropdown__item${typeFilter === t.value ? ' app-dropdown__item--active' : ''}`}
                  onClick={() => {
                    setTypeFilter(t.value)
                    setPage(1)
                    setMoreTypesOpen(false)
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
          <>
            <TransactionTable
              columns={SORTABLE_COLUMNS}
              data={tableData}
              currencyCode={currencyCode}
              dateFormat={dateFormat}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={((key: string) => toggleSort(key as SortColumn))}
              onEdit={openEdit}
              onDelete={(id) => setDeleting(data.transactions.find(t => t.id === id) || null)}
              selection={selectedIds}
              onToggleSelect={toggleSelectRow}
              onToggleSelectAll={toggleSelectAll}
              allSelected={allOnPageSelected}
              someSelected={someOnPageSelected}
              showBalanceColumn={showRunningBalance}
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
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
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
        variant="danger"
        busy={deletingBusy}
      />

      {/* Bulk delete confirmation modal */}
      <ConfirmModal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Transactions"
        message={
          <p>
            Are you sure you want to permanently delete <strong>{selectedIds.size}</strong> selected transactions? This action cannot be undone.
          </p>
        }
        confirmLabel={`Delete ${selectedIds.size} Transactions`}
        variant="danger"
        busy={bulkDeletingBusy}
      />
    </div>
  )
}

export default Transactions