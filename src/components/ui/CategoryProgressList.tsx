import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCompactCurrency, formatCurrency } from '../../utils/currency'
import { getCategoryColor } from '../../utils/chart'
import type { CategoryBreakdown } from '../../../electron/types/ipc'

interface CategoryProgressListProps {
  items: CategoryBreakdown[]
  currencyCode: string
  emptyMessage?: string
  accentColor?: 'accent' | 'success' | 'danger' | 'warning'
  maxItems?: number
  centerLabel?: string
}

interface DonutSlice {
  id: number | string
  name: string
  value: number
  percent: number
  count: number
  color: string
}

export default function CategoryProgressList({
  items,
  currencyCode,
  emptyMessage = 'No category data recorded yet.',
  maxItems = 6,
  centerLabel = 'Total in period',
}: CategoryProgressListProps): React.JSX.Element {
  const totalSum = useMemo(() => {
    return items.reduce((acc, curr) => acc + Math.abs(curr.total), 0)
  }, [items])

  const slices = useMemo<DonutSlice[]>(() => {
    if (items.length === 0 || totalSum <= 0) {
      return []
    }

    // Hide zero slices (e.g. Equipment 0% which renders an orphan stub)
    const positive = items.filter((item) => Math.abs(item.total) > 0)
    if (positive.length === 0) {
      return []
    }

    // Separate slices: under 1% are grouped into "Other"
    const qualified: CategoryBreakdown[] = []
    let otherValue = 0
    let otherCount = 0

    for (const item of positive) {
      const val = Math.abs(item.total)
      const pct = (val / totalSum) * 100
      if (pct < 1) {
        otherValue += val
        otherCount += item.count
      } else {
        qualified.push(item)
      }
    }

    // Sort qualified items descending by value
    qualified.sort((a, b) => Math.abs(b.total) - Math.abs(a.total))

    // Top maxItems are kept; remaining overflow into "Other"
    const top = qualified.slice(0, maxItems)
    const overflow = qualified.slice(maxItems)
    for (const item of overflow) {
      otherValue += Math.abs(item.total)
      otherCount += item.count
    }

    const result: DonutSlice[] = top.map((item) => {
      const value = Math.abs(item.total)
      return {
        id: item.category_id,
        name: item.category_name,
        value,
        percent: (value / totalSum) * 100,
        count: item.count,
        color: getCategoryColor(item.category_name),
      }
    })

    if (otherValue > 0) {
      result.push({
        id: 'other',
        name: 'Other',
        value: otherValue,
        percent: (otherValue / totalSum) * 100,
        count: otherCount,
        color: '#94a3b8',
      })
    }

    return result
  }, [items, maxItems, totalSum])

  if (items.length === 0 || slices.length === 0) {
    return <p className="cat-progress__empty">{emptyMessage}</p>
  }

  return (
    <div className="cat-donut">
      <div className="cat-donut__chart-wrap">
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={slices.length > 1 ? 3 : 0}
              cornerRadius={6}
              stroke="none"
            >
              {slices.map((slice) => (
                <Cell key={slice.id} fill={slice.color} />
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
              itemStyle={{ color: 'var(--text)', fontWeight: 700 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="cat-donut__center" aria-hidden="true">
          <span className="cat-donut__center-val" title={formatCurrency(totalSum, currencyCode)}>
            {formatCompactCurrency(totalSum, currencyCode)}
          </span>
          <span className="cat-donut__center-sub">{centerLabel}</span>
        </div>
      </div>

      <div className="cat-donut__grid">
        {slices.map((slice) => (
          <div key={slice.id} className="cat-donut__item">
            <div className="cat-donut__item-top">
              <span
                className="cat-donut__dot"
                style={{ backgroundColor: slice.color }}
                aria-hidden="true"
              />
              <span className="cat-donut__name" title={slice.name}>
                {slice.name}
              </span>
              <span className="cat-donut__pct">{Math.round(slice.percent)}%</span>
            </div>
            <div className="cat-donut__item-bottom">
              <span className="cat-donut__amount">
                {formatCurrency(slice.value, currencyCode)}
              </span>
              <span className="cat-donut__count">
                {slice.count} {slice.count === 1 ? 'tx' : 'txs'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
