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
import { computeChartYDomain, type CashFlowChartDatum } from '../../utils/chart'
import { formatCompactCurrency, formatCurrency, toFiniteNumber } from '../../utils/currency'

export interface CashFlowLabels {
  inflow: string
  outflow: string
  net: string
}

const DEFAULT_LABELS: CashFlowLabels = {
  inflow: 'Income',
  outflow: 'Expenses',
  net: 'Net Cash Flow',
}

const INFLOW_COLOR = '#7048e8'
const OUTFLOW_COLOR = '#f59e0b'

interface TooltipPayloadItem {
  dataKey?: string | number
  value?: number | string
  payload?: CashFlowChartDatum & { outflowAbs?: number }
}

interface CashFlowTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  currencyCode: string
  labels: CashFlowLabels
}

function CashFlowTooltip({ active, payload, label, currencyCode, labels }: CashFlowTooltipProps): React.JSX.Element | null {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  const datum = payload[0]?.payload
  if (!datum) {
    return null
  }

  const inflow = toFiniteNumber(datum.inflow)
  const outflow = Math.abs(toFiniteNumber(datum.outflow))
  const net = toFiniteNumber(datum.net)

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">{datum.fullLabel || label}</p>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">
          <span className="chart-tooltip__swatch" style={{ background: INFLOW_COLOR }} />
          {labels.inflow}
        </span>
        <span className="chart-tooltip__value cf-positive">{formatCurrency(inflow, currencyCode)}</span>
      </div>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">
          <span className="chart-tooltip__swatch" style={{ background: OUTFLOW_COLOR }} />
          {labels.outflow}
        </span>
        <span className="chart-tooltip__value cf-negative">{formatCurrency(outflow, currencyCode)}</span>
      </div>
      <div className="chart-tooltip__row chart-tooltip__row--net">
        <span className="chart-tooltip__label">
          <span className="chart-tooltip__dot" style={{ background: 'var(--text)' }} />
          {labels.net}
        </span>
        <span className={`chart-tooltip__value ${net >= 0 ? 'cf-positive' : 'cf-negative'}`}>
          {net >= 0 ? '+' : ''}{formatCurrency(net, currencyCode)}
        </span>
      </div>
    </div>
  )
}

interface CashFlowChartProps {
  data: CashFlowChartDatum[]
  currencyCode: string
  height?: number
  labels?: Partial<CashFlowLabels>
  rangeText?: string
}

function CashFlowChart({ data, currencyCode, height = 300, labels: labelOverrides, rangeText }: CashFlowChartProps): React.JSX.Element {
  const uid = useId().replace(/:/g, '')
  const inflowGradId = `inflow-grad-${uid}`
  const outflowGradId = `outflow-grad-${uid}`
  const labels: CashFlowLabels = { ...DEFAULT_LABELS, ...labelOverrides }

  const chartData = data.map((datum) => {
    const inflow = Math.max(0, toFiniteNumber(datum.inflow))
    const outflowAbs = Math.abs(toFiniteNumber(datum.outflow))
    return {
      ...datum,
      inflow,
      outflowAbs,
      net: toFiniteNumber(datum.net),
    }
  })

  const hasMovement = chartData.some(
    (datum) => datum.inflow !== 0 || datum.outflowAbs !== 0 || datum.net !== 0,
  )

  if (chartData.length === 0 || !hasMovement) {
    return (
      <div className="chart-empty chart-empty--cashflow" style={{ height }}>
        <p className="chart-empty__title">No cash flow data for this period.</p>
        <p className="chart-empty__hint">Add income or expense transactions to see your cash flow.</p>
      </div>
    )
  }

  const [, maxVal] = computeChartYDomain(chartData.flatMap((datum) => [datum.inflow, datum.outflowAbs]))
  const yDomain: [number, number] = [0, Math.max(100, maxVal)]

  return (
    <div className="cf-spline-wrap">
      <div className="cf-spline-legend">
        <div className="cf-spline-legend__items">
          <span className="cf-spline-legend__item">
            <span className="cf-spline-legend__swatch" style={{ background: INFLOW_COLOR }} />
            <span>{labels.inflow}</span>
          </span>
          <span className="cf-spline-legend__item">
            <span className="cf-spline-legend__swatch" style={{ background: OUTFLOW_COLOR }} />
            <span>{labels.outflow}</span>
          </span>
        </div>
        {rangeText ? (
          <span className="cf-spline-legend__range">{rangeText}</span>
        ) : null}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 14, right: 16, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={inflowGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={INFLOW_COLOR} stopOpacity={0.28} />
              <stop offset="95%" stopColor={INFLOW_COLOR} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id={outflowGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={OUTFLOW_COLOR} stopOpacity={0.22} />
              <stop offset="95%" stopColor={OUTFLOW_COLOR} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
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
            content={<CashFlowTooltip currencyCode={currencyCode} labels={labels} />}
          />
          <Area
            type="monotone"
            dataKey="inflow"
            name={labels.inflow}
            stroke={INFLOW_COLOR}
            strokeWidth={2.5}
            fill={`url(#${inflowGradId})`}
            dot={false}
            activeDot={{ r: 5, stroke: 'var(--bg-surface)', strokeWidth: 2.5, fill: INFLOW_COLOR }}
          />
          <Area
            type="monotone"
            dataKey="outflowAbs"
            name={labels.outflow}
            stroke={OUTFLOW_COLOR}
            strokeWidth={2.5}
            fill={`url(#${outflowGradId})`}
            dot={false}
            activeDot={{ r: 5, stroke: 'var(--bg-surface)', strokeWidth: 2.5, fill: OUTFLOW_COLOR }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CashFlowChart
