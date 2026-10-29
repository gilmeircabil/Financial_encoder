import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Reports from '../../src/pages/Reports/Reports'

vi.mock('electron', () => ({
  app: {
    getPath: () => '/mock/path',
  },
}))

const { mockTotals, mockBreakdown, mockMonthly } = vi.hoisted(() => ({
  mockTotals: {
    income: 20000,
    expense: 23278097,
    capital: 0,
    withdrawal: 0,
    asset: 0,
    liability: 0,
    net: -23258097,
    count: 12,
  },
  mockBreakdown: [
    { category_id: 1, category_name: 'Food', type: 'expense', total: 23232121, count: 1 },
    { category_id: 2, category_name: 'Other Expenses', type: 'expense', total: 45976, count: 10 },
    { category_id: 3, category_name: 'Business Income', type: 'income', total: 20000, count: 1 },
  ],
  mockMonthly: [
    { month: '2026-10', income: 20000, expense: 23278097, capital: 0, withdrawal: 0, net: -23258097, count: 12 },
  ],
}))

vi.mock('../../src/services/api', () => ({
  api: {
    calculations: {
      totals: vi.fn().mockResolvedValue(mockTotals),
      byCategory: vi.fn().mockResolvedValue(mockBreakdown),
      monthly: vi.fn().mockResolvedValue(mockMonthly),
    },
    exports: {
      file: vi.fn().mockResolvedValue(undefined),
    },
  },
  ApiError: class extends Error {},
}))

vi.mock('../../src/contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { currency: 'PHP', dateFormat: 'YYYY-MM-DD' },
  }),
}))

vi.mock('../../src/contexts/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('../../src/contexts/DateRangeContext', async () => {
  const actual = await vi.importActual('../../src/contexts/DateRangeContext')
  return {
    ...actual,
    useDateRange: () => ({
      range: { date_from: '2026-01-01', date_to: '2026-12-31' },
      customInvalid: false,
      period: 'this-year',
      periodLabel: 'This Year (2026)',
      setPeriod: vi.fn(),
    }),
  }
})

describe('Reports & Export Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders executive summary KPI cards with financial metrics', async () => {
    render(<Reports />)

    await waitFor(() => {
      expect(screen.getByText('Financial Reports')).toBeInTheDocument()
      expect(screen.getByText('Operating Revenue')).toBeInTheDocument()
      expect(screen.getAllByText('Operating Expenses').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Total Transactions')).toBeInTheDocument()
    })
  })

  it('renders formal financial statements', async () => {
    render(<Reports />)

    await waitFor(() => {
      expect(screen.getByText('Income Statement')).toBeInTheDocument()
      expect(screen.getByText('Cash Flow Position')).toBeInTheDocument()
      expect(screen.getByText('Capital & Equity')).toBeInTheDocument()
    })
  })

  it('renders the timeline scale notice when an expenditure outlier is present', async () => {
    render(<Reports />)

    await waitFor(() => {
      expect(screen.getAllByText('Timeline Scale Notice').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/Food/).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders the monthly summary table with reconciled period totals in tfoot', async () => {
    render(<Reports />)

    await waitFor(() => {
      expect(screen.getAllByText('Monthly Ledger Summary').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/Reconciled Period Total/).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders print and export buttons', async () => {
    render(<Reports />)

    await waitFor(() => {
      expect(screen.getAllByText('Print').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/Export/).length).toBeGreaterThanOrEqual(1)
    })
  })
})
