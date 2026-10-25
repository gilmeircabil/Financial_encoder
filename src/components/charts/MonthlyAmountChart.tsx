import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthlySummary } from '../../../electron/types/ipc'
import { computeChartYDomain } from '../../utils/chart'
import { formatCompactCurrency, formatCurrency, toFiniteNumber } from '../../utils/currency'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

type AmountKind = 'income' | 'expense' | 'capital' | 'withdrawal'

interface KindConfig {
  label: string
  color: string
  prefix: string
  valueClass: string
}

const KIND_CONFIG: Record<AmountKind, KindConfig> = {
  income: {
    label: 'Income',
    color: '#10b981',
    prefix: '+',
    valueClass: 'cf-positive',
  },
  expense: {
    label: 'Expenses',
    color: '#f59e0b',
    prefix: '-',
    valueClass: 'cf-negative',
  },
  capital: {
    label: 'Capital Added',
    color: '#7048e8',
    prefix: '+',
    valueClass: 'cf-positive',
  },
  withdrawal: {
    label: 'Owner Withdrawals',
    color: '#f97316',
    prefix: '-',
    valueClass: 'cf-negative',
  },
}

function formatLabel(monthKey: string): { month: string; fullLabel: string } {
  const parts = monthKey.split('-')
  const y = parts[0]
  const m = Number(parts[1])
  if (isNaN(m) || m < 1 || m > 12) {
    return { month: monthKey, fullLabel: monthKey }
  }
  return {
    month: `${MONTHS_SHORT[m - 1]} ${y}`,
    fullLabel: `${MONTHS_LONG[m - 1]} ${y}`,
  }
}

interface MonthlyChartDatum {
  month: string
  fullLabel: string
  amount: number
}

interface TooltipPayloadItem {
  dataKey?: string | number
  value?: number | string
  payload?: MonthlyChartDatum
}

interface MonthlyTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  currencyCode: string
  kind: AmountKind
}

function MonthlyTooltip({ active, payload, currencyCode, kind }: MonthlyTooltipProps): React.JSX.Element | null {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  const datum = payload[0]?.payload
  if (!datum) {
    return null
  }
  const config = KIND_CONFIG[kind]
  const amount = toFiniteNumber(datum.amount)

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">{datum.fullLabel}</p>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">
          <span className="chart-tooltip__swatch" style={{ background: config.color }} />
          {config.label}
        </span>
        <span className={`chart-tooltip__value ${config.valueClass}`}>
          {config.prefix}{formatCurrency(amount, currencyCode)}
        </span>
      </div>
    </div>
  )
}

export interface MonthlyAmountChartProps {
  data: MonthlySummary[]
  kind: AmountKind
  currencyCode: string
  height?: number
}

function MonthlyAmountChart({ data, kind, currencyCode, height = 240 }: MonthlyAmountChartProps): React.JSX.Element {
  const uid = useId().replace(/:/g, '')
  const gradId = `monthly-grad-${kind}-${uid}`
  const config = KIND_CONFIG[kind]

  const chartData: MonthlyChartDatum[] = data.map((row) => {
    const { month, fullLabel } = formatLabel(row.month)
    return {
      month,
      fullLabel,
      amount: Math.max(0, toFiniteNumber(row[kind])),
    }
  })

  const hasMovement = chartData.some((datum) => datum.amount !== 0)

  if (chartData.length === 0 || !hasMovement) {
    return (
      <div className="chart-empty chart-empty--cashflow" style={{ height }}>
        <p className="chart-empty__title">No {config.label.toLowerCase()} recorded for this period.</p>
        <p className="chart-empty__hint">Transactions will populate this monthly trend.</p>
      </div>
    )
  }

  const [, maxVal] = computeChartYDomain(chartData.map((d) => d.amount))
  const yDomain: [number, number] = [0, Math.max(100, maxVal)]

  return (
    <div className="cf-spline-wrap">
      <div className="cf-spline-legend">
        <div className="cf-spline-legend__items">
          <span className="cf-spline-legend__item">
            <span className="cf-spline-legend__swatch" style={{ background: config.color }} />
            <span>{config.label}</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 14, right: 16, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.color} stopOpacity={0.28} />
              <stop offset="95%" stopColor={config.color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tickMargin={10}
            minTickGap={20}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            width={68}
            domain={yDomain}
            tickFormatter={(value: number) => formatCompactCurrency(value, currencyCode)}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={<MonthlyTooltip currencyCode={currencyCode} kind={kind} />}
          />
          <Area
            type="monotone"
            dataKey="amount"
            name={config.label}
            stroke={config.color}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 5, stroke: 'var(--bg-surface)', strokeWidth: 2.5, fill: config.color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MonthlyAmountChart
