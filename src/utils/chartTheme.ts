/**
 * Chart Design Token System
 * Centralized theming for all charts ensuring visual consistency
 */

export interface ChartColors {
  // Semantic colors
  positive: string
  negative: string
  neutral: string
  net: string

  // Specific metric colors
  income: string
  expense: string
  capital: string
  withdrawal: string

  // Chart series colors
  inflow: string
  outflow: string
  netFlow: string

  // Category palette
  categoryPalette: readonly string[]

  // UI colors (CSS variable references)
  background: string
  cardBackground: string
  border: string
  borderStrong: string
  textPrimary: string
  textMuted: string
  tooltipBackground: string
  tooltipBorder: string
  gridLine: string
  axisLine: string
}

export const CHART_COLORS: ChartColors = {
  // Semantic
  positive: '#10B981',
  negative: '#F87171',
  neutral: '#94A3B8',
  net: '#8067FF',

  // Specific metrics
  income: '#10B981',
  expense: '#F87171',
  capital: '#8067FF',
  withdrawal: '#F97316',

  // Cash flow series
  inflow: '#8067FF',
  outflow: '#F87171',
  netFlow: '#22D3EE',

  // Category palette (30 colors)
  categoryPalette: [
    '#8067FF', '#22D3EE', '#10B981', '#F87171', '#F59E0B',
    '#EC4899', '#A3E635', '#F97316', '#6366F1', '#14B8A6',
    '#84CC16', '#D946EF', '#0EA5E9', '#E11D48', '#EAB308',
    '#A855F7', '#22C55E', '#2DD4BF', '#FB923C', '#818CF8',
    '#4ADE80', '#F43F5E', '#38BDF8', '#C084FC', '#FBBF24',
    '#34D399', '#60A5FA', '#F87171', '#A78BFA', '#FDA4AF',
  ],

  // CSS variable references for theming
  background: 'var(--bg)',
  cardBackground: 'var(--bg-surface)',
  border: 'var(--border)',
  borderStrong: 'var(--border-strong)',
  textPrimary: 'var(--text)',
  textMuted: 'var(--text-muted)',
  tooltipBackground: 'var(--bg-surface)',
  tooltipBorder: 'var(--border-strong)',
  gridLine: 'var(--border)',
  axisLine: 'var(--border)',
}

export interface ChartSpacing {
  margin: { top: number; right: number; left: number; bottom: number }
  padding: number
  barRadius: number
  maxBarSize: number
  dotRadius: number
  activeDotRadius: number
  legendGap: number
}

export const CHART_SPACING: ChartSpacing = {
  margin: { top: 14, right: 16, left: 16, bottom: 4 },
  padding: 12,
  barRadius: 4,
  maxBarSize: 48,
  dotRadius: 3,
  activeDotRadius: 5,
  legendGap: 16,
}

export interface ChartTypography {
  axisTickFontSize: number
  axisTickFontFamily: string
  tooltipTitleFontSize: number
  tooltipValueFontSize: number
  legendFontSize: number
  emptyTitleFontSize: number
  emptyHintFontSize: number
}

export const CHART_TYPOGRAPHY: ChartTypography = {
  axisTickFontSize: 12,
  axisTickFontFamily: 'inherit',
  tooltipTitleFontSize: 13,
  tooltipValueFontSize: 13,
  legendFontSize: 12,
  emptyTitleFontSize: 14,
  emptyHintFontSize: 12,
}

export interface ChartAnimation {
  duration: number
  easing: string
}

export const CHART_ANIMATION: ChartAnimation = {
  duration: 300,
  easing: 'ease-out',
}

export interface MonthlyAmountChartConfig {
  kind: 'income' | 'expense' | 'capital' | 'withdrawal'
  label: string
  color: string
  prefix: '+' | '-'
  valueClass: 'cf-positive' | 'cf-negative'
}

export const MONTHLY_AMOUNT_CONFIG: Record<'income' | 'expense' | 'capital' | 'withdrawal', MonthlyAmountChartConfig> = {
  income: { kind: 'income', label: 'Income', color: CHART_COLORS.income, prefix: '+', valueClass: 'cf-positive' },
  expense: { kind: 'expense', label: 'Expenses', color: CHART_COLORS.expense, prefix: '-', valueClass: 'cf-negative' },
  capital: { kind: 'capital', label: 'Capital Added', color: CHART_COLORS.capital, prefix: '+', valueClass: 'cf-positive' },
  withdrawal: { kind: 'withdrawal', label: 'Owner Withdrawals', color: CHART_COLORS.withdrawal, prefix: '-', valueClass: 'cf-negative' },
}

export interface CashFlowChartConfig {
  inflowColor: string
  outflowColor: string
  netColor: string
  defaultLabels: {
    inflow: string
    outflow: string
    net: string
  }
}

export const CASH_FLOW_CONFIG: CashFlowChartConfig = {
  inflowColor: CHART_COLORS.inflow,
  outflowColor: CHART_COLORS.outflow,
  netColor: CHART_COLORS.netFlow,
  defaultLabels: {
    inflow: 'Income',
    outflow: 'Expenses',
    net: 'Net Cash Flow',
  },
}

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
  const index = (hash >>> 0) % CHART_COLORS.categoryPalette.length
  return CHART_COLORS.categoryPalette[index]
}

export {
  computeNiceTicks,
  cashFlowPointsToChartData,
  monthlyToCashFlowChartData,
  trimTrailingEmptyCashFlowPoints,
  trimTrailingEmptyMonthly,
  type CashFlowChartDatum,
  type NiceTicksResult,
} from './chart'
