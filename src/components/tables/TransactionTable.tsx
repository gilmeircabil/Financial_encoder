import { useRef, useEffect } from 'react'
import { formatCurrency } from '../../utils/currency'
import { formatDate, parseISODate } from '../../utils/dates'
import { getCategoryColor } from '../../utils/chart'

export interface TransactionColumn {
  key: string
  label: string
  className?: string
  sortable?: boolean
}

export interface TransactionRow {
  id: number
  date: string
  description: string
  amount: number
  type: string
  category_name: string
  cumulativeBalance?: number
  notes?: string | null
}

export interface TransactionTableProps {
  columns: TransactionColumn[]
  data: TransactionRow[]
  currencyCode?: string
  dateFormat?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  onEdit?: (row: TransactionRow) => void
  onDelete?: (id: number) => void
  selection?: Set<number>
  onToggleSelect?: (id: number) => void
  onToggleSelectAll?: () => void
  allSelected?: boolean
  someSelected?: boolean
  showBalanceColumn?: boolean
}

function SortHeader({ columnKey, label, sortBy, sortDir, onSort }: {
  columnKey: string
  label: string
  sortBy: string | undefined
  sortDir: 'asc' | 'desc' | undefined
  onSort: (key: string) => void
}): React.JSX.Element {
  const isActive = sortBy === columnKey
  return (
    <button
      type="button"
      className={`tx-table__sort ${isActive ? 'tx-table__sort--active' : ''}`}
      onClick={() => onSort(columnKey)}
      aria-label={`Sort by ${label}`}
    >
      <span>{label}</span>
      {isActive ? (
        <span className="tx-table__sort-icon tx-table__sort-icon--active" aria-hidden="true">
          {sortDir === 'asc' ? '↑' : '↓'}
        </span>
      ) : (
        <span className="tx-table__sort-icon tx-table__sort-icon--idle" aria-hidden="true">↕</span>
      )}
    </button>
  )
}

export function TransactionTable({
  columns,
  data,
  currencyCode = 'PHP',
  dateFormat = 'YYYY-MM-DD',
  sortBy,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  selection,
  onToggleSelect,
  onToggleSelectAll,
  allSelected = false,
  someSelected = false,
  showBalanceColumn = false,
}: TransactionTableProps): React.JSX.Element {
  const selectAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  const hasSelection = selection !== undefined && onToggleSelect !== undefined

  return (
    <div className="tx-table-wrap">
      <table className="tx-table">
        <thead>
          <tr>
            {hasSelection && (
              <th className="tx-cell-check">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all transactions on page"
                />
              </th>
            )}
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.sortable && onSort ? (
                  <SortHeader
                    columnKey={col.key}
                    label={col.label}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={onSort}
                  />
                ) : (
                  <span>{col.label}</span>
                )}
              </th>
            ))}
            {showBalanceColumn && (
              <th className="tx-table__amount">Running Balance</th>
            )}
            {(onEdit || onDelete) && (
              <th className="tx-table__actions-head">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const isOutflow = row.type === 'expense' || row.type === 'withdrawal' || row.type === 'liability'
            const isSelected = selection?.has(row.id) ?? false

            return (
              <tr key={row.id} className={`tx-row ${isSelected ? 'tx-row--selected' : ''}`}>
                {hasSelection && (
                  <td className="tx-cell-check">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect?.(row.id)}
                      aria-label={`Select transaction ${row.description}`}
                    />
                  </td>
                )}
                {columns.map((col) => {
                  switch (col.key) {
                    case 'date':
                      return (
                        <td key={col.key} className={col.className || 'tx-cell-date'}>
                          <time dateTime={row.date}>{formatDate(parseISODate(row.date), dateFormat)}</time>
                        </td>
                      )
                    case 'description':
                      return (
                        <td key={col.key} className={col.className || 'tx-cell-desc'}>
                          <span className="tx-table__desc">{row.description}</span>
                          {row.notes ? <span className="tx-table__notes">{row.notes}</span> : null}
                        </td>
                      )
                    case 'amount':
                      return (
                        <td
                          key={col.key}
                          className={`${col.className ? col.className + ' ' : ''}tx-table__amount ${isOutflow ? 'cf-negative' : 'cf-positive'}`}
                        >
                          <span className="tx-amount-badge">
                            {isOutflow ? '-' : '+'}{formatCurrency(Math.abs(row.amount), currencyCode)}
                          </span>
                        </td>
                      )
                    case 'type':
                      return (
                        <td key={col.key} className={col.className}>
                          <span className={`badge badge--${row.type}`}>{row.type}</span>
                        </td>
                      )
                    case 'category':
                    case 'category_name':
                      return (
                        <td key={col.key} className={col.className || 'tx-cell-cat'}>
                          <span className="tx-category-tag">
                            <span
                              className="tx-category-dot"
                              style={{ backgroundColor: getCategoryColor(row.category_name || '') }}
                              aria-hidden="true"
                            />
                            <span>{row.category_name}</span>
                          </span>
                        </td>
                      )
                    default:
                      return (
                        <td key={col.key} className={col.className}>
                          {(row as unknown as Record<string, React.ReactNode>)[col.key] ?? null}
                        </td>
                      )
                  }
                })}
                {showBalanceColumn && (
                  <td className={`tx-table__amount ${(row.cumulativeBalance ?? 0) >= 0 ? 'cf-positive' : 'cf-negative'}`}>
                    <span className="tx-amount-badge">
                      {formatCurrency(row.cumulativeBalance ?? 0, currencyCode)}
                    </span>
                  </td>
                )}
                {(onEdit || onDelete) && (
                  <td className="tx-table__actions">
                    {onEdit && (
                      <button
                        type="button"
                        className="btn btn--sm tx-action-btn tx-action-btn--edit"
                        onClick={() => onEdit(row)}
                        title="Edit transaction"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                        <span>Edit</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className="btn btn--sm tx-action-btn tx-action-btn--delete"
                        onClick={() => onDelete(row.id)}
                        title="Delete transaction"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" x2="10" y1="11" y2="17" />
                          <line x1="14" x2="14" y1="11" y2="17" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}