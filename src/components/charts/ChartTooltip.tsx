import { formatCurrency, toFiniteNumber } from '../../utils/currency'
import type { CashFlowChartDatum } from '../../utils/chartTheme'

export interface ChartTooltipLabel {
  /** Data key to match against datum fields */
  dataKey: 'inflow' | 'outflow' | 'net' | 'amount'
  /** Label text for the series */
  label: string
  /** Color for the swatch/line */
  color: string
  /** CSS class for value (e.g., 'cf-positive', 'cf-negative') */
  valueClass: string
  /** Optional prefix for value (e.g., '+', '-') */
  prefix?: string
  /** Type of visual indicator: 'swatch' for bars, 'line' for lines */
  indicatorType?: 'swatch' | 'line'
}

export interface ChartTooltipProps {
  /** Whether tooltip is active */
  active?: boolean
  /** Tooltip payload from Recharts */
  payload?: Array<{
    dataKey?: string | number
    value?: number | string
    payload?: CashFlowChartDatum & { outflowAbs?: number } | { amount: number }
  }>
  /** Current label (time period) */
  label?: string
  /** Currency code for formatting */
  currencyCode: string
  /** Array of series labels with styling */
  seriesLabels: ChartTooltipLabel[]
  /** Optional custom title formatter */
  titleFormatter?: (label: string, datum: unknown) => string
}

function ChartTooltip({
  active,
  payload,
  label,
  currencyCode,
  seriesLabels,
  titleFormatter,
}: ChartTooltipProps): React.JSX.Element | null {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  const datum = payload[0]?.payload
  if (!datum) {
    return null
  }

  const title = titleFormatter ? titleFormatter(label ?? '', datum) : ('fullLabel' in datum ? (datum as CashFlowChartDatum).fullLabel : label)

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">{title}</p>
      {seriesLabels.map((series, index) => {
        let value: number
        if ('outflowAbs' in datum) {
          // CashFlowChartDatum
          switch (series.dataKey) {
            case 'inflow':
              value = Math.max(0, toFiniteNumber(datum.inflow))
              break
            case 'outflow':
              value = Math.abs(toFiniteNumber(datum.outflow))
              break
            case 'net':
              value = toFiniteNumber(datum.net)
              break
            default:
              value = 0
          }
        } else if ('amount' in datum) {
          // MonthlyChartDatum
          value = toFiniteNumber(datum.amount)
        } else {
          value = 0
        }

        const formattedValue = series.prefix ? `${series.prefix}${formatCurrency(Math.abs(value), currencyCode)}` : formatCurrency(value, currencyCode)

        return (
          <div key={index} className="chart-tooltip__row">
            <span className="chart-tooltip__label">
              {series.indicatorType === 'line' ? (
                <span className="chart-tooltip__line" style={{ background: series.color }} />
              ) : (
                <span className="chart-tooltip__swatch" style={{ background: series.color }} />
              )}
              {series.label}
            </span>
            <span className={`chart-tooltip__value ${series.valueClass}`}>{formattedValue}</span>
          </div>
        )
      })}
    </div>
  )
}

export default ChartTooltip