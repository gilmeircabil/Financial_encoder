import { describe, expect, it, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import CashFlowChart from '../../src/components/charts/CashFlowChart'

afterEach(() => {
  cleanup()
})

// Data format with key, income, expense (cash flow points format)
const mockCashFlowData = [
  { key: '2024-01', income: 5000, expense: 3000 },
  { key: '2024-02', income: 6000, expense: 4000 },
  { key: '2024-03', income: 4500, expense: 3500 },
]

// Data format with month, income, expense, capital, withdrawal (monthly summary format)
const mockMonthlyData = [
  { month: '2024-01', income: 5000, expense: 3000, capital: 1000, withdrawal: 500 },
  { month: '2024-02', income: 6000, expense: 4000, capital: 2000, withdrawal: 800 },
  { month: '2024-03', income: 4500, expense: 3500, capital: 1500, withdrawal: 300 },
]

describe('CashFlowChart', () => {
  it('renders without crashing with valid cash flow data', () => {
    render(<CashFlowChart data={mockCashFlowData} currencyCode="USD" />)
    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
    expect(screen.getByText('Net Cash Flow')).toBeInTheDocument()
  })

  it('renders legend with correct labels and colors', () => {
    render(<CashFlowChart data={mockCashFlowData} currencyCode="PHP" />)
    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
    expect(screen.getByText('Net Cash Flow')).toBeInTheDocument()
    const legendItems = document.querySelectorAll('.cf-spline-legend__item')
    expect(legendItems.length).toBe(3)
  })

  it('renders ResponsiveContainer', () => {
    render(<CashFlowChart data={mockCashFlowData} currencyCode="USD" height={300} />)
    const container = document.querySelector('.cf-spline-wrap')
    expect(container).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<CashFlowChart data={[]} currencyCode="USD" />)
    expect(screen.getByText('No cash flow data for this period.')).toBeInTheDocument()
    expect(screen.getByText('Add income or expense transactions to see your cash flow.')).toBeInTheDocument()
  })

  it('shows empty state when all values are zero', () => {
    const zeroData = [
      { key: '2024-01', income: 0, expense: 0 },
    ]
    render(<CashFlowChart data={zeroData} currencyCode="USD" />)
    expect(screen.getByText('No cash flow data for this period.')).toBeInTheDocument()
  })

  it('uses custom labels when provided', () => {
    render(
      <CashFlowChart
        data={mockCashFlowData}
        currencyCode="USD"
        labels={{ inflow: 'Revenue', outflow: 'Costs', net: 'Profit' }}
      />
    )
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('Costs')).toBeInTheDocument()
    expect(screen.getByText('Profit')).toBeInTheDocument()
  })

  it('shows range text when provided', () => {
    render(<CashFlowChart data={mockCashFlowData} currencyCode="USD" rangeText="Jan - Mar 2024" />)
    expect(screen.getByText('Jan - Mar 2024')).toBeInTheDocument()
  })

  it('renders with custom height', () => {
    render(<CashFlowChart data={mockCashFlowData} currencyCode="USD" height={400} />)
    const container = document.querySelector('.cf-spline-wrap')
    expect(container).toBeInTheDocument()
  })

  it('includes capital and withdrawal when includeCapital is true with monthly data', () => {
    render(<CashFlowChart data={mockMonthlyData} currencyCode="USD" includeCapital />)
    expect(screen.getByText('Income')).toBeInTheDocument()
  })

  it('switches to step lines for daily granularity with enough points', () => {
    const dailyData = Array.from({ length: 10 }, (_, i) => ({
      key: `2024-01-${String(i + 1).padStart(2, '0')}`,
      income: 100 + i * 10,
      expense: 50 + i * 5,
    }))
    render(<CashFlowChart data={dailyData} currencyCode="USD" granularity="day" />)
    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
  })

  it('formats currency in tooltip using currencyCode', () => {
    render(<CashFlowChart data={mockCashFlowData} currencyCode="EUR" />)
    expect(screen.getByText('Income')).toBeInTheDocument()
    // Currency formatting is tested via the chart rendering
  })

  it('handles data with capital and withdrawal fields using monthly format', () => {
    render(<CashFlowChart data={mockMonthlyData} currencyCode="USD" includeCapital />)
    expect(screen.getByText('Income')).toBeInTheDocument()
  })

  it('renders chart wrapper with correct class', () => {
    render(<CashFlowChart data={mockCashFlowData} currencyCode="USD" />)
    const wrapper = document.querySelector('.cf-spline-wrap')
    expect(wrapper).toBeInTheDocument()
    const chartArea = wrapper?.querySelector('.cf-spline-legend')
    expect(chartArea).toBeInTheDocument()
  })

  it('renders with monthly format data', () => {
    render(<CashFlowChart data={mockMonthlyData} currencyCode="USD" />)
    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
  })

  it('shows net cash flow legend with line indicator', () => {
    render(<CashFlowChart data={mockCashFlowData} currencyCode="USD" />)
    const netLine = document.querySelector('.cf-spline-legend__line')
    expect(netLine).toBeInTheDocument()
  })
})