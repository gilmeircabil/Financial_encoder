import { useEffect, useState } from 'react'
import { formatDate } from '../utils/dates'

interface UseFormattedDateOptions {
  date?: Date
  dateFormat?: string
  updateIntervalMs?: number
}

export function useFormattedDate({
  date = new Date(),
  dateFormat = 'YYYY-MM-DD',
  updateIntervalMs = 60_000,
}: UseFormattedDateOptions = {}): { formattedDate: string; currentDate: Date } {
  const [currentDate, setCurrentDate] = useState<Date>(date)

  const formattedDate = formatDate(currentDate, dateFormat)

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentDate(new Date()), updateIntervalMs)
    return () => window.clearInterval(timer)
  }, [updateIntervalMs])

  return { formattedDate, currentDate }
}

export default useFormattedDate