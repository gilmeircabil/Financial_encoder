import { useMemo } from 'react'
import { formatCurrency } from '../../utils/currency'
import type { CategoryBreakdown } from '../../../electron/types/ipc'

interface CategoryProgressListProps {
  items: CategoryBreakdown[]
  currencyCode: string
  emptyMessage?: string
  accentColor?: 'accent' | 'success' | 'danger' | 'warning'
  maxItems?: number
}

const COLOR_PALETTES = [
  'var(--accent)',
  'var(--success)',
  'var(--info)',
  'var(--warning)',
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  'var(--danger)',
  'var(--text-muted)',
]

export default function CategoryProgressList({
  items,
  currencyCode,
  emptyMessage = 'No category data recorded yet.',
  maxItems = 6,
}: CategoryProgressListProps): React.JSX.Element {
  const displayItems = useMemo(() => items.slice(0, maxItems), [items, maxItems])

  const totalSum = useMemo(() => {
    return items.reduce((acc, curr) => acc + Math.abs(curr.total), 0)
  }, [items])

  if (items.length === 0) {
    return <p className="cat-progress__empty">{emptyMessage}</p>
  }

  return (
    <div className="cat-progress-list">
      {displayItems.map((item, index) => {
        const absVal = Math.abs(item.total)
        const percent = totalSum > 0 ? (absVal / totalSum) * 100 : 0
        const color = COLOR_PALETTES[index % COLOR_PALETTES.length]

        return (
          <div key={item.category_id} className="cat-progress-item">
            <div className="cat-progress-item__header">
              <div className="cat-progress-item__name-wrap">
                <span
                  className="cat-progress-item__dot"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span className="cat-progress-item__name" title={item.category_name}>
                  {item.category_name}
                </span>
                <span className="cat-progress-item__count">
                  {item.count} {item.count === 1 ? 'tx' : 'txs'}
                </span>
              </div>
              <div className="cat-progress-item__values">
                <span className="cat-progress-item__amount">
                  {formatCurrency(item.total, currencyCode)}
                </span>
                <span className="cat-progress-item__percent">
                  {percent.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="cat-progress-item__track" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="cat-progress-item__bar"
                style={{
                  width: `${Math.max(3, Math.min(100, percent))}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
