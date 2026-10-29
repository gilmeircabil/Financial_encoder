import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  customRangeInvalid,
  PERIOD_KEYS,
  PERIOD_LABELS,
  periodRange,
  type PeriodKey,
  type PeriodRange,
} from '../utils/periods'
import { formatDate, parseISODate } from '../utils/dates'
import { useSettings } from './SettingsContext'

export interface DateRangeContextValue {
  period: PeriodKey
  customFrom: string
  customTo: string
  range: PeriodRange
  periodLabel: string
  customInvalid: boolean
  setPeriod: (period: PeriodKey) => void
  setCustomFrom: (from: string) => void
  setCustomTo: (to: string) => void
}

const DateRangeContext = createContext<DateRangeContextValue | undefined>(undefined)

export function DateRangeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { settings } = useSettings()
  const dateFormat = settings?.dateFormat ?? 'YYYY-MM-DD'

  const [period, setPeriod] = useState<PeriodKey>('this-year')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const range = useMemo(() => periodRange(period, customFrom, customTo), [period, customFrom, customTo])
  const customInvalid = customRangeInvalid(customFrom, customTo)

  const periodLabel = useMemo(() => {
    if (period === 'custom') {
      const from = customFrom ? formatDate(parseISODate(customFrom), dateFormat) : null
      const to = customTo ? formatDate(parseISODate(customTo), dateFormat) : null
      if (from && to) return `${from} – ${to}`
      if (from) return `From ${from}`
      if (to) return `Up to ${to}`
      return 'Custom period'
    }
    return PERIOD_LABELS[period] || 'All time'
  }, [period, customFrom, customTo, dateFormat])

  const value = useMemo<DateRangeContextValue>(
    () => ({
      period,
      customFrom,
      customTo,
      range,
      periodLabel,
      customInvalid,
      setPeriod,
      setCustomFrom,
      setCustomTo,
    }),
    [period, customFrom, customTo, range, periodLabel, customInvalid],
  )

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>
}

export function useDateRange(): DateRangeContextValue {
  const context = useContext(DateRangeContext)
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider')
  }
  return context
}

export { PERIOD_KEYS, PERIOD_LABELS }
