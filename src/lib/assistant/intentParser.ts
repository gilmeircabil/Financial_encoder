import type { Category } from '../../../electron/types/ipc'
import type { ParsedDateRange, ParsedIntent } from './types'

const MONTHS: Array<{ name: string; short: string; monthIndex: number }> = [
  { name: 'january', short: 'jan', monthIndex: 0 },
  { name: 'february', short: 'feb', monthIndex: 1 },
  { name: 'march', short: 'mar', monthIndex: 2 },
  { name: 'april', short: 'apr', monthIndex: 3 },
  { name: 'may', short: 'may', monthIndex: 4 },
  { name: 'june', short: 'jun', monthIndex: 5 },
  { name: 'july', short: 'jul', monthIndex: 6 },
  { name: 'august', short: 'aug', monthIndex: 7 },
  { name: 'september', short: 'sep', monthIndex: 8 },
  { name: 'october', short: 'oct', monthIndex: 9 },
  { name: 'november', short: 'nov', monthIndex: 10 },
  { name: 'december', short: 'dec', monthIndex: 11 },
]

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function parseDateRangeFromPrompt(prompt: string, referenceDate: Date = new Date()): ParsedDateRange {
  const p = prompt.toLowerCase()
  const year = referenceDate.getFullYear()

  if (p.includes('today')) {
    const todayStr = `${year}-${pad(referenceDate.getMonth() + 1)}-${pad(referenceDate.getDate())}`
    return { date_from: todayStr, date_to: todayStr, label: 'Today' }
  }

  if (p.includes('last month')) {
    const lastMonthDate = new Date(year, referenceDate.getMonth() - 1, 1)
    const lmYear = lastMonthDate.getFullYear()
    const lmMonth = lastMonthDate.getMonth()
    const lastDay = new Date(lmYear, lmMonth + 1, 0).getDate()
    const from = `${lmYear}-${pad(lmMonth + 1)}-01`
    const to = `${lmYear}-${pad(lmMonth + 1)}-${pad(lastDay)}`
    return { date_from: from, date_to: to, label: `${MONTHS[lmMonth].name.toUpperCase()} ${lmYear}` }
  }

  if (p.includes('last 3 months') || p.includes('past 3 months') || p.includes('quarter')) {
    const fromDate = new Date(year, referenceDate.getMonth() - 2, 1)
    const from = `${fromDate.getFullYear()}-${pad(fromDate.getMonth() + 1)}-01`
    const lastDay = new Date(year, referenceDate.getMonth() + 1, 0).getDate()
    const to = `${year}-${pad(referenceDate.getMonth() + 1)}-${pad(lastDay)}`
    return { date_from: from, date_to: to, label: 'Last 3 Months' }
  }

  if (p.includes('this year') || p.includes('all year') || p.includes('annual')) {
    return { date_from: `${year}-01-01`, date_to: `${year}-12-31`, label: `Year ${year}` }
  }

  if (p.includes('all time') || p.includes('overall') || p.includes('entire history')) {
    return { label: 'All Time' }
  }

  // Check specific month mentions (e.g. "in october", "for sept")
  for (const m of MONTHS) {
    const regex = new RegExp(`\\b(${m.name}|${m.short})\\b`, 'i')
    if (regex.test(p)) {
      const lastDay = new Date(year, m.monthIndex + 1, 0).getDate()
      const from = `${year}-${pad(m.monthIndex + 1)}-01`
      const to = `${year}-${pad(m.monthIndex + 1)}-${pad(lastDay)}`
      const capName = m.name.charAt(0).toUpperCase() + m.name.slice(1)
      return { date_from: from, date_to: to, label: `${capName} ${year}` }
    }
  }

  // Default to this month
  const curMonth = referenceDate.getMonth()
  const lastDay = new Date(year, curMonth + 1, 0).getDate()
  const from = `${year}-${pad(curMonth + 1)}-01`
  const to = `${year}-${pad(curMonth + 1)}-${pad(lastDay)}`
  const capMonth = MONTHS[curMonth].name.charAt(0).toUpperCase() + MONTHS[curMonth].name.slice(1)
  return { date_from: from, date_to: to, label: `${capMonth} ${year}` }
}

export function parseIntent(prompt: string, categories: Category[] = [], referenceDate: Date = new Date()): ParsedIntent {
  const rawQuery = prompt.trim()
  const p = rawQuery.toLowerCase()
  const dateRange = parseDateRangeFromPrompt(p, referenceDate)

  // 1. Help inquiry
  if (p === 'help' || p.includes('what can you do') || p.includes('commands') || p.includes('how to use')) {
    return { kind: 'help', dateRange, rawQuery }
  }

  // 2. Anomaly detection
  if (p.includes('anomal') || p.includes('unusual') || p.includes('suspicious') || p.includes('outlier') || p.includes('irregular')) {
    return { kind: 'anomalies', dateRange, rawQuery }
  }

  // 3. Burn rate inquiry
  if (p.includes('burn') || p.includes('daily spend') || p.includes('burn rate') || p.includes('per day')) {
    return { kind: 'burn_rate', dateRange, rawQuery }
  }

  // 4. Savings rate / Operating margin
  if (p.includes('saving') || p.includes('margin') || p.includes('retention') || p.includes('efficiency')) {
    return { kind: 'savings_rate', dateRange, rawQuery }
  }

  // 5. Biggest / highest transaction
  if (
    p.includes('biggest') ||
    p.includes('largest') ||
    p.includes('highest') ||
    p.includes('top spend') ||
    p.includes('top expense') ||
    p.includes('max expense')
  ) {
    const isIncome = p.includes('income') || p.includes('revenue') || p.includes('gain')
    return {
      kind: 'biggest_transaction',
      type: isIncome ? 'income' : 'expense',
      dateRange,
      rawQuery,
    }
  }

  // 6. Net cash position / liquidity balance
  if (
    p.includes('cash position') ||
    p.includes('net cash') ||
    p.includes('net flow') ||
    p.includes('how much do i have') ||
    p.includes('balance') ||
    p.includes('surplus') ||
    p.includes('deficit')
  ) {
    return { kind: 'cash_position', dateRange, rawQuery }
  }

  // 7. Check for known category matching
  for (const cat of categories) {
    const catNameLower = cat.name.toLowerCase()
    if (p.includes(catNameLower)) {
      const isIncome = cat.type === 'income' || p.includes('income') || p.includes('earn') || p.includes('received')
      return {
        kind: isIncome ? 'income_source' : 'spending_category',
        categoryName: cat.name,
        categoryId: cat.id,
        type: cat.type,
        dateRange,
        rawQuery,
      }
    }
  }

  // 8. General Financial Summary / Overview
  if (
    p.includes('summary') ||
    p.includes('overview') ||
    p.includes('how am i doing') ||
    p.includes('status') ||
    p.includes('recap') ||
    p.includes('performance') ||
    p.includes('cash flow')
  ) {
    return { kind: 'summary', dateRange, rawQuery }
  }

  // 9. Search transactions
  const searchMatch = p.match(/(?:find|search|show|look for|filter)\s+(?:transaction[s]?\s+)?(?:about\s+|for\s+)?["']?([^"']+)["']?/i)
  if (searchMatch && searchMatch[1]) {
    const term = searchMatch[1].trim()
    return { kind: 'search', searchTerm: term, dateRange, rawQuery }
  }

  // 10. Fallback
  return { kind: 'unknown', dateRange, rawQuery }
}
