import { useMemo } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CashFlowGranularity } from '../../../electron/types/ipc'
import { computeNiceTicks, trimTrailingEmptyCashFlowPoints, type CashFlowChartDatum } from '../../utils/chart'
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
const NET_COLOR = '#38bdf8'

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
          <span className="chart-tooltip__line" style={{ background: NET_COLOR }} />
          {labels.net}
        </span>
        <span className={`chart-tooltip__value ${net >= 0 ? 'cf-positive' : 'cf-negative'}`}>
          {net >= 0 ? '+' : ''}{formatCurrency(net, currencyCode)}
        </span>
      </div>
    </div>
  )
}

export interface CashFlowChartProps {
  data: CashFlowChartDatum[]
  currencyCode: string
  height?: number
  labels?: Partial<CashFlowLabels>
  rangeText?: string
  granularity?: CashFlowGranularity
}

function CashFlowChart({
  data,
  currencyCode,
  height = 300,
  labels: labelOverrides,
  rangeText,
  granularity = 'month',
}: CashFlowChartProps): React.JSX.Element {
  const labels: CashFlowLabels = { ...DEFAULT_LABELS, ...labelOverrides }

  const chartData = useMemo(() => {
    const raw = data.map((datum) => {
      const inflow = Math.max(0, toFiniteNumber(datum.inflow))
      const outflowAbs = Math.abs(toFiniteNumber(datum.outflow))
      return {
        ...datum,
        inflow,
        outflowAbs,
        net: toFiniteNumber(datum.net),
      }
    })
    return trimTrailingEmptyCashFlowPoints(raw)
  }, [data])

  const hasMovement = chartData.some(
    (datum) => datum.inflow !== 0 || datum.outflowAbs !== 0 || datum.net !== 0,
  )

  const { domain: yDomain, ticks: niceTicks } = useMemo(() => {
    const allVals = chartData.flatMap((datum) => [datum.inflow, datum.outflowAbs, datum.net])
    const maxVal = Math.max(0, ...allVals)
    const minVal = Math.min(0, ...allVals)
    return computeNiceTicks(minVal, maxVal)
  }, [chartData])

  if (chartData.length === 0 || !hasMovement) {
    return (
      <div className="chart-empty chart-empty--cashflow" style={{ height }}>
        <p className="chart-empty__title">No cash flow data for this period.</p>
        <p className="chart-empty__hint">Add income or expense transactions to see your cash flow.</p>
      </div>
    )
  }

  // Use step line only if granularity is daily and series has at least 3 points.
  // If fewer than 3 points, always render bars (never a lone dot).
  const isDailyStep = granularity === 'day' && chartData.length >= 3

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
          <span className="cf-spline-legend__item">
            <span className="cf-spline-legend__line" style={{ background: NET_COLOR }} />
            <span>{labels.net}</span>
          </span>
        </div>
        {rangeText ? (
          <span className="cf-spline-legend__range">{rangeText}</span>
        ) : null}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 14, right: 16, left: 16, bottom: 4 }}>
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
            ticks={niceTicks}
            tickFormatter={(value: number) => formatCompactCurrency(value, currencyCode)}
          />
          <Tooltip
            cursor={
              isDailyStep
                ? { stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '4 4' }
                : { fill: 'var(--bg-card-hover)', opacity: 0.4 }
            }
            content={<CashFlowTooltip currencyCode={currencyCode} labels={labels} />}
          />
          {isDailyStep ? (
            <>
              <Line
                type="stepAfter"
                dataKey="inflow"
                name={labels.inflow}
                stroke={INFLOW_COLOR}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="stepAfter"
                dataKey="outflowAbs"
                name={labels.outflow}
                stroke={OUTFLOW_COLOR}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="stepAfter"
                dataKey="net"
                name={labels.net}
                stroke={NET_COLOR}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 5 }}
              />
            </>
          ) : (
            <>
              <Bar
                dataKey="inflow"
                name={labels.inflow}
                fill={INFLOW_COLOR}
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="outflowAbs"
                name={labels.outflow}
                fill={OUTFLOW_COLOR}
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
              <Line
                type="monotone"
                dataKey="net"
                name={labels.net}
                stroke={NET_COLOR}
                strokeWidth={2.5}
                dot={{ r: 3, fill: NET_COLOR }}
                activeDot={{ r: 5 }}
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CashFlowChart
