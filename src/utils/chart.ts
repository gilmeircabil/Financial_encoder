import type { CashFlowGranularity, CashFlowPoint, MonthlySummary } from '../../electron/types/ipc'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Normalised datum consumed by the cash-flow chart.
 * `inflow` is money coming in (plotted above zero) and `outflow` is the
 * positive magnitude of money going out (plotted below zero).
 */
export interface CashFlowChartDatum {
  key: string
  label: string
  fullLabel: string
  inflow: number
  outflow: number
  net: number
}

function shortParts(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split('-').map((part) => Number(part))
  return { y, m, d }
}

function monthDatum(key: string): { label: string; fullLabel: string } {
  const { y, m } = shortParts(key)
  return {
    label: `${MONTHS_SHORT[m - 1]} ${y}`,
    fullLabel: `${MONTHS_LONG[m - 1]} ${y}`,
  }
}

function dayDatum(key: string): { label: string; fullLabel: string } {
  const { y, m, d } = shortParts(key)
  return {
    label: `${MONTHS_SHORT[m - 1]} ${d}`,
    fullLabel: `${MONTHS_LONG[m - 1]} ${d}, ${y}`,
  }
}

function weekDatum(key: string): { label: string; fullLabel: string } {
  const { y, m, d } = shortParts(key)
  return {
    label: `Wk ${MONTHS_SHORT[m - 1]} ${d}`,
    fullLabel: `Week of ${MONTHS_LONG[m - 1]} ${d}, ${y}`,
  }
}

/** Converts a cash-flow time series into chart-ready data. */
export function cashFlowPointsToChartData(
  points: CashFlowPoint[],
  granularity: CashFlowGranularity,
): CashFlowChartDatum[] {
  return points.map((point) => {
    const label =
      granularity === 'month' ? monthDatum(point.key) : granularity === 'week' ? weekDatum(point.key) : dayDatum(point.key)
    return {
      key: point.key,
      label: label.label,
      fullLabel: label.fullLabel,
      inflow: point.income,
      outflow: point.expense,
      net: point.income - point.expense,
    }
  })
}

/**
 * Converts a monthly summary into chart data. When `includeCapital` is true,
 * capital is treated as cash coming in and withdrawals as cash going out.
 */
export function monthlyToCashFlowChartData(
  rows: MonthlySummary[],
  includeCapital: boolean,
): CashFlowChartDatum[] {
  return rows.map((row) => {
    const inflow = includeCapital ? row.income + row.capital : row.income
    const outflow = includeCapital ? row.expense + row.withdrawal : row.expense
    const label = monthDatum(row.month)
    return {
      key: row.month,
      label: label.label,
      fullLabel: label.fullLabel,
      inflow,
      outflow,
      net: inflow - outflow,
    }
  })
}

/**
 * Builds a padded Y-axis domain that always includes zero.
 *
 * - all-zero data gets a small symmetric domain
 * - all-positive data starts at zero
 * - all-negative data ends at zero
 * - mixed data is padded above and below
 */
export function computeChartYDomain(values: number[]): [number, number] {
  let min = 0
  let max = 0

  for (const value of values) {
    if (!Number.isFinite(value)) {
      continue
    }
    if (value < min) {
      min = value
    }
    if (value > max) {
      max = value
    }
  }

  if (min === 0 && max === 0) {
    return [0, 1]
  }

  const span = max - min
  const padding = span > 0 ? span * 0.12 : Math.max(Math.abs(max), Math.abs(min), 1) * 0.12

  return [min < 0 ? min - padding : 0, max > 0 ? max + padding : 0]
}

/** Curated palette of stable, distinct, and accessible colors for financial categories. */
export const CATEGORY_PALETTE: readonly string[] = [
  '#8b5cf6', // Finly Purple
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#a3e635', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#84cc16', // Bright Lime
  '#d946ef', // Fuchsia
  '#0ea5e9', // Sky
  '#e11d48', // Crimson
  '#eab308', // Yellow
  '#a855f7', // Violet
  '#22c55e', // Green
  '#2dd4bf', // Mint
  '#fb923c', // Tangerine
  '#818cf8', // Periwinkle
  '#4ade80', // Light Green
  '#f43f5e', // Rose
  '#38bdf8', // Light Blue
  '#c084fc', // Lilac
]

/**
 * Maps a category name deterministically to a stable color in CATEGORY_PALETTE
 * using an FNV-1a hash. 'Other' always maps to neutral slate.
 */
export function getCategoryColor(categoryName: string): string {
  if (!categoryName) return '#94a3b8'
  const norm = categoryName.trim().toLowerCase()
  if (norm === 'other' || norm === 'others') {
    return '#94a3b8'
  }
  let hash = 2166136261
  for (let i = 0; i < norm.length; i++) {
    hash ^= norm.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const index = (hash >>> 0) % CATEGORY_PALETTE.length
  return CATEGORY_PALETTE[index]
}

export interface NiceTicksResult {
  domain: [number, number]
  ticks: number[]
}

/**
 * Computes human-friendly round Y-axis ticks and domain.
 * Generates round numbers like 0, 10M, 20M, 30M instead of fractional ticks like 9.5M, 19M, 28.5M.
 */
export function computeNiceTicks(min: number, max: number, maxTicks = 5): NiceTicksResult {
  const safeMin = Number.isFinite(min) ? min : 0
  const safeMax = Number.isFinite(max) ? max : 0

  if (safeMin === safeMax) {
    if (safeMin === 0) {
      return { domain: [0, 100], ticks: [0, 25, 50, 75, 100] }
    }
    if (safeMin > 0) {
      const step = Math.pow(10, Math.floor(Math.log10(safeMin)))
      const niceMax = Math.ceil((safeMin * 1.2) / step) * step
      return { domain: [0, niceMax], ticks: [0, safeMin, niceMax] }
    }
    const step = Math.pow(10, Math.floor(Math.log10(Math.abs(safeMin))))
    const niceMin = Math.floor((safeMin * 1.2) / step) * step
    return { domain: [niceMin, 0], ticks: [niceMin, safeMin, 0] }
  }

  const span = safeMax - safeMin
  const rawStep = span / Math.max(1, maxTicks - 1)
  const power = Math.floor(Math.log10(rawStep))
  const magnitude = Math.pow(10, power)
  const fraction = rawStep / magnitude

  let niceFraction = 1
  if (fraction <= 1) niceFraction = 1
  else if (fraction <= 2) niceFraction = 2
  else if (fraction <= 2.5) niceFraction = 2.5
  else if (fraction <= 5) niceFraction = 5
  else niceFraction = 10

  const step = niceFraction * magnitude
  const niceMin = Math.floor(safeMin / step) * step
  const niceMax = Math.ceil(safeMax / step) * step

  const ticks: number[] = []
  const count = Math.round((niceMax - niceMin) / step)
  for (let i = 0; i <= count; i++) {
    const val = Number((niceMin + i * step).toPrecision(12))
    ticks.push(val)
  }

  return { domain: [niceMin, niceMax], ticks }
}

/**
 * Trims trailing zero-activity data points from the end of a time series
 * so the chart's x-axis domain fits the actual data instead of running blank to the edge.
 */
export function trimTrailingEmptyCashFlowPoints<
  T extends { inflow: number; outflow: number; net?: number }
>(points: T[]): T[] {
  let lastActive = -1
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i]
    if (p.inflow !== 0 || p.outflow !== 0 || (p.net !== undefined && p.net !== 0)) {
      lastActive = i
      break
    }
  }
  if (lastActive === -1) {
    return points
  }
  return points.slice(0, lastActive + 1)
}

/**
 * Trims trailing zero-amount items from a monthly time series.
 */
export function trimTrailingEmptyMonthly<T extends { amount: number }>(points: T[]): T[] {
  let lastActive = -1
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].amount !== 0) {
      lastActive = i
      break
    }
  }
  if (lastActive === -1) {
    return points
  }
  return points.slice(0, lastActive + 1)
}
