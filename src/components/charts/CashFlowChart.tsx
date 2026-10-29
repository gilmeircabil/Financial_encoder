import { useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CashFlowGranularity } from '../../../electron/types/ipc'
import {
  computeNiceTicks,
  cashFlowPointsToChartData,
  monthlyToCashFlowChartData,
  CASH_FLOW_CONFIG,
  CHART_COLORS,
  CHART_SPACING,
  CHART_TYPOGRAPHY,
  type CashFlowChartDatum,
} from '../../utils/chartTheme'
import type { ChartTooltipLabel } from './ChartTooltip'
import { formatCompactCurrency, toFiniteNumber } from '../../utils/currency'
import ChartTooltip from './ChartTooltip'
import ChartEmptyState from './ChartEmptyState'

export interface CashFlowLabels {
  inflow: string
  outflow: string
  net: string
}

export interface CashFlowChartProps {
  data: Array<{ key: string; income: number; expense: number }> | Array<{ month: string; income: number; expense: number; capital?: number; withdrawal?: number }> | CashFlowChartDatum[]
  currencyCode: string
  height?: number | `${number}%`
  minHeight?: number
  labels?: Partial<CashFlowLabels>
  rangeText?: string
  granularity?: CashFlowGranularity
  includeCapital?: boolean
}

function CashFlowChart({
  data,
  currencyCode,
  height = '100%',
  minHeight = 260,
  labels: labelOverrides,
  rangeText,
  granularity = 'month',
  includeCapital = false,
}: CashFlowChartProps): React.JSX.Element {
  const labels: CashFlowLabels = { ...CASH_FLOW_CONFIG.defaultLabels, ...labelOverrides }

  // Convert data if it's monthly summary format
  const chartData = useMemo(() => {
    if (data.length === 0) return []
    const first = data[0] as any
    let raw: CashFlowChartDatum[]
    if ('inflow' in first && 'outflow' in first && ('label' in first || 'key' in first)) {
      raw = data as CashFlowChartDatum[]
    } else if ('month' in first) {
      raw = monthlyToCashFlowChartData(data as any, includeCapital)
    } else {
      raw = cashFlowPointsToChartData(data as any, granularity, includeCapital)
    }

    return raw.map((datum) => ({
      ...datum,
      inflow: Math.max(0, toFiniteNumber(datum.inflow)),
      outflow: toFiniteNumber(datum.outflow),
      outflowAbs: Math.abs(toFiniteNumber(datum.outflow)),
      net: toFiniteNumber(datum.net),
    }))
  }, [data, granularity, includeCapital])

  const hasMovement = chartData.some(
    (datum) => datum.inflow !== 0 || datum.outflowAbs !== 0 || datum.net !== 0,
  )

  const { domain: yDomain, ticks: niceTicks } = useMemo(() => {
    const allVals = chartData
      .flatMap((datum) => [datum.inflow, datum.outflowAbs, datum.net])
      .filter((v) => Number.isFinite(v))
    const maxVal = allVals.length > 0 ? Math.max(0, ...allVals) : 0
    const minVal = allVals.length > 0 ? Math.min(0, ...allVals) : 0
    return computeNiceTicks(minVal, maxVal)
  }, [chartData])

  const isDailyStep = granularity === 'day' && chartData.length >= 3

  // Build series labels for tooltip
  const seriesLabels = useMemo<ChartTooltipLabel[]>(() => [
    {
      dataKey: 'inflow' as const,
      label: labels.inflow,
      color: CASH_FLOW_CONFIG.inflowColor,
      valueClass: 'cf-positive',
      indicatorType: isDailyStep ? 'line' : 'swatch',
    },
    {
      dataKey: 'outflow' as const,
      label: labels.outflow,
      color: CASH_FLOW_CONFIG.outflowColor,
      valueClass: 'cf-negative',
      indicatorType: isDailyStep ? 'line' : 'swatch',
    },
    {
      dataKey: 'net' as const,
      label: labels.net,
      color: CASH_FLOW_CONFIG.netColor,
      valueClass: '',
      indicatorType: 'line',
    },
  ], [labels, isDailyStep])

  if (chartData.length === 0 || !hasMovement) {
    return (
      <ChartEmptyState
        height={height}
        title="No cash flow data for this period."
        hint="Add income or expense transactions to see your cash flow."
      />
    )
  }

  return (
    <div className="cf-spline-wrap">
      <div className="cf-spline-legend">
        <div className="cf-spline-legend__items">
          <span className="cf-spline-legend__item">
            <span className="cf-spline-legend__swatch" style={{ background: CASH_FLOW_CONFIG.inflowColor }} />
            <span>{labels.inflow}</span>
          </span>
          <span className="cf-spline-legend__item">
            <span className="cf-spline-legend__swatch" style={{ background: CASH_FLOW_CONFIG.outflowColor }} />
            <span>{labels.outflow}</span>
          </span>
          <span className="cf-spline-legend__item">
            <span className="cf-spline-legend__line" style={{ background: CASH_FLOW_CONFIG.netColor }} />
            <span>{labels.net}</span>
          </span>
        </div>
        {rangeText ? (
          <span className="cf-spline-legend__range">{rangeText}</span>
        ) : null}
      </div>

      <div className="cf-spline-chart-inner">
        <ResponsiveContainer width="100%" height={height} minHeight={minHeight}>
          <ComposedChart data={chartData} margin={CHART_SPACING.margin}>
            <defs>
              <linearGradient id="cf-grad-inflow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CASH_FLOW_CONFIG.inflowColor} stopOpacity={0.38} />
                <stop offset="92%" stopColor={CASH_FLOW_CONFIG.inflowColor} stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="cf-grad-outflow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CASH_FLOW_CONFIG.outflowColor} stopOpacity={0.32} />
                <stop offset="92%" stopColor={CASH_FLOW_CONFIG.outflowColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} vertical={false} />
            <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="2 2" />
            <XAxis
              dataKey="label"
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
            {isDailyStep ? (
              <>
                <Line
                  type="stepAfter"
                  dataKey="inflow"
                  name={labels.inflow}
                  stroke={CASH_FLOW_CONFIG.inflowColor}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: CHART_SPACING.activeDotRadius }}
                />
                <Line
                  type="stepAfter"
                  dataKey="outflowAbs"
                  name={labels.outflow}
                  stroke={CASH_FLOW_CONFIG.outflowColor}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: CHART_SPACING.activeDotRadius }}
                />
                <Line
                  type="stepAfter"
                  dataKey="net"
                  name={labels.net}
                  stroke={CASH_FLOW_CONFIG.netColor}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: CHART_SPACING.activeDotRadius }}
                />
              </>
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="inflow"
                  name={labels.inflow}
                  stroke={CASH_FLOW_CONFIG.inflowColor}
                  strokeWidth={2.5}
                  fill="url(#cf-grad-inflow)"
                  dot={false}
                  activeDot={{ r: 5, fill: CASH_FLOW_CONFIG.inflowColor, stroke: 'var(--bg-surface, #121217)', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="outflowAbs"
                  name={labels.outflow}
                  stroke={CASH_FLOW_CONFIG.outflowColor}
                  strokeWidth={2.5}
                  fill="url(#cf-grad-outflow)"
                  dot={false}
                  activeDot={{ r: 5, fill: CASH_FLOW_CONFIG.outflowColor, stroke: 'var(--bg-surface, #121217)', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  name={labels.net}
                  stroke={CASH_FLOW_CONFIG.netColor}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: CASH_FLOW_CONFIG.netColor, stroke: 'var(--bg-surface, #121217)', strokeWidth: 2 }}
                />
              </>
            )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </div>
  )
}

export default CashFlowChart
