import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthlySummary } from '../../../electron/types/ipc'
import {
  computeNiceTicks,
  trimTrailingEmptyMonthly,
  MONTHLY_AMOUNT_CONFIG,
  CHART_COLORS,
  CHART_SPACING,
  CHART_TYPOGRAPHY,
} from '../../utils/chartTheme'
import { formatCompactCurrency, toFiniteNumber } from '../../utils/currency'
import ChartTooltip, { type ChartTooltipLabel } from './ChartTooltip'
import ChartEmptyState from './ChartEmptyState'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface MonthlyChartDatum {
  month: string
  fullLabel: string
  amount: number
}

export interface MonthlyAmountChartProps {
  data: MonthlySummary[]
  kind: 'income' | 'expense' | 'capital' | 'withdrawal'
  currencyCode: string
  height?: number | `${number}%`
  minHeight?: number
}

function formatLabel(monthKey: string): { month: string; fullLabel: string } {
  const parts = monthKey.split('-')
  const y = parts[0]
  const m = Number(parts[1])
  if (isNaN(m) || m < 1 || m > 12) {
    return { month: monthKey, fullLabel: monthKey }
  }
  return {
    month: MONTHS_SHORT[m - 1],
    fullLabel: `${MONTHS_LONG[m - 1]} ${y}`,
  }
}

export function MonthlyAmountChart({
  data,
  kind,
  currencyCode,
  height = '100%',
  minHeight = 240,
}: MonthlyAmountChartProps): React.JSX.Element {
  const config = MONTHLY_AMOUNT_CONFIG[kind]

  const chartData: MonthlyChartDatum[] = useMemo(() => {
    const raw = data.map((row) => {
      const { month, fullLabel } = formatLabel(row.month)
      return {
        month,
        fullLabel,
        amount: Math.max(0, toFiniteNumber(row[kind])),
      }
    })
    return raw.length >= 12 ? raw : trimTrailingEmptyMonthly(raw)
  }, [data, kind])

  const hasMovement = chartData.some((datum) => datum.amount !== 0)

  const { domain: yDomain, ticks: niceTicks } = useMemo(() => {
    const validAmounts = chartData
      .map((d) => d.amount)
      .filter((v) => Number.isFinite(v))
    const maxVal = validAmounts.length > 0 ? Math.max(0, ...validAmounts) : 0
    return computeNiceTicks(0, maxVal)
  }, [chartData])

  // Build series labels for tooltip
  const seriesLabels = useMemo<ChartTooltipLabel[]>(() => [
    {
      dataKey: 'amount' as const,
      label: config.label,
      color: config.color,
      valueClass: config.valueClass,
      prefix: config.prefix,
      indicatorType: 'swatch',
    },
  ], [config])

  if (chartData.length === 0 || !hasMovement) {
    return (
      <ChartEmptyState
        height={height}
        title={`No ${config.label.toLowerCase()} recorded for this period.`}
        hint="Transactions will populate this monthly trend."
      />
    )
  }

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

      <div className="cf-spline-chart-inner">
        <ResponsiveContainer width="100%" height={height} minHeight={minHeight}>
          <AreaChart data={chartData} margin={CHART_SPACING.margin}>
            <defs>
              <linearGradient id={`monthly-grad-${kind}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.color} stopOpacity={0.38} />
                <stop offset="92%" stopColor={config.color} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} vertical={false} />
            <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="2 2" />
            <XAxis
              dataKey="month"
              tick={{
                fontSize: CHART_TYPOGRAPHY.axisTickFontSize,
                fill: CHART_COLORS.textMuted,
                fontFamily: CHART_TYPOGRAPHY.axisTickFontFamily,
              }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.axisLine }}
              tickMargin={10}
              minTickGap={20}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{
                fontSize: CHART_TYPOGRAPHY.axisTickFontSize,
                fill: CHART_COLORS.textMuted,
                fontFamily: CHART_TYPOGRAPHY.axisTickFontFamily,
              }}
              tickLine={false}
              axisLine={false}
              width={68}
              domain={yDomain}
              ticks={niceTicks}
              tickFormatter={(value: number) => formatCompactCurrency(value, currencyCode)}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(255, 255, 255, 0.16)', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={<ChartTooltip currencyCode={currencyCode} seriesLabels={seriesLabels} />}
            />
            <Area
              type="monotone"
              dataKey="amount"
              name={config.label}
              stroke={config.color}
              strokeWidth={2.5}
              fill={`url(#monthly-grad-${kind})`}
              dot={false}
              activeDot={{ r: 5, fill: config.color, stroke: 'var(--bg-surface, #121217)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
  </div>
)
}

export default MonthlyAmountChart