import type { TransactionType } from '../../../electron/types/ipc'

export type IntentKind =
  | 'summary'
  | 'spending_category'
  | 'income_source'
  | 'biggest_transaction'
  | 'burn_rate'
  | 'savings_rate'
  | 'anomalies'
  | 'cash_position'
  | 'search'
  | 'help'
  | 'registry_question'
  | 'unknown'

export interface ParsedDateRange {
  date_from?: string
  date_to?: string
  label: string
}

export interface ParsedIntent {
  kind: IntentKind
  questionId?: string
  categoryName?: string
  categoryId?: number
  type?: TransactionType
  searchTerm?: string
  dateRange: ParsedDateRange
  rawQuery: string
}

export interface AssistantTableData {
  headers: string[]
  rows: string[][]
}

export interface AssistantCardData {
  headline?: string
  dateRangeLabel?: string
  primaryValue?: string
  primaryLabel?: string
  variant?: 'positive' | 'negative' | 'neutral' | 'capital'
  badge?: string
  breakdown?: Array<{ label: string; value: string; color?: string }>
  table?: AssistantTableData
  actionLink?: string
  actionLabel?: string
}

export interface AssistantMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  data?: AssistantCardData
  suggestions?: string[]
  questionId?: string
}
