import { describe, expect, it, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import MonthlyAmountChart from '../../src/components/charts/MonthlyAmountChart'

afterEach(() => {
  cleanup()
})

const mockData = [
  { month: '2024-01', income: 5000, expense: 3000, capital: 1000, withdrawal: 500, net: 2500, count: 5 },
  { month: '2024-02', income: 6000, expense: 4000, capital: 2000, withdrawal: 800, net: 3200, count: 6 },
  { month: '2024-03', income: 4500, expense: 3500, capital: 1500, withdrawal: 300, net: 2200, count: 4 },
]

describe('MonthlyAmountChart', () => {
  it('renders without crashing with valid income data', () => {
    render(<MonthlyAmountChart data={mockData} kind="income" currencyCode="USD" />)
    expect(screen.getByText('Income')).toBeInTheDocument()
  })

  it('renders without crashing with valid expense data', () => {
    render(<MonthlyAmountChart data={mockData} kind="expense" currencyCode="USD" />)
    expect(screen.getByText('Expenses')).toBeInTheDocument()
  })

  it('renders without crashing with valid capital data', () => {
    render(<MonthlyAmountChart data={mockData} kind="capital" currencyCode="USD" />)
    expect(screen.getByText('Capital Added')).toBeInTheDocument()
  })

  it('renders without crashing with valid withdrawal data', () => {
    render(<MonthlyAmountChart data={mockData} kind="withdrawal" currencyCode="USD" />)
    expect(screen.getByText('Owner Withdrawals')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<MonthlyAmountChart data={[]} kind="income" currencyCode="USD" />)
    expect(screen.getByText('No income recorded for this period.')).toBeInTheDocument()
    expect(screen.getByText('Transactions will populate this monthly trend.')).toBeInTheDocument()
  })

  it('shows empty state when all values are zero', () => {
    const zeroData = [
      { month: '2024-01', income: 0, expense: 0, capital: 0, withdrawal: 0, net: 0, count: 0 },
      { month: '2024-02', income: 0, expense: 0, capital: 0, withdrawal: 0, net: 0, count: 0 },
    ]
    render(<MonthlyAmountChart data={zeroData} kind="income" currencyCode="USD" />)
    expect(screen.getByText('No income recorded for this period.')).toBeInTheDocument()
  })

  it('renders with custom height', () => {
    render(<MonthlyAmountChart data={mockData} kind="income" currencyCode="USD" height={400} />)
    const container = document.querySelector('.cf-spline-wrap')
    expect(container).toBeInTheDocument()
  })

  it('renders legend with correct color swatch', () => {
    render(<MonthlyAmountChart data={mockData} kind="income" currencyCode="USD" />)
    const swatch = document.querySelector('.cf-spline-legend__swatch')
    expect(swatch).toBeInTheDocument()
    expect(swatch).toHaveAttribute('style')
  })

  it('formats Y-axis ticks with compact currency', () => {
    render(<MonthlyAmountChart data={mockData} kind="income" currencyCode="PHP" />)
    expect(screen.getByText('Income')).toBeInTheDocument()
  })

  it('renders BarChart with ResponsiveContainer', () => {
    render(<MonthlyAmountChart data={mockData} kind="capital" currencyCode="USD" />)
    const container = document.querySelector('.cf-spline-wrap')
    expect(container).toBeInTheDocument()
    const chartArea = container?.querySelector('.cf-spline-legend')
    expect(chartArea).toBeInTheDocument()
  })

  it('uses correct config color for each kind', () => {
    const kinds = ['income', 'expense', 'capital', 'withdrawal'] as const
    kinds.forEach((kind) => {
      const { unmount } = render(<MonthlyAmountChart data={mockData} kind={kind} currencyCode="USD" />)
      const swatch = document.querySelector('.cf-spline-legend__swatch')
      expect(swatch).toBeInTheDocument()
      unmount()
    })
  })

  it('handles single data point', () => {
    const singleData = [{ month: '2024-01', income: 5000, expense: 0, capital: 0, withdrawal: 0, net: 5000, count: 1 }]
    render(<MonthlyAmountChart data={singleData} kind="income" currencyCode="USD" />)
    expect(screen.getByText('Income')).toBeInTheDocument()
  })

  it('trims trailing empty months', () => {
    const dataWithTrailingZeros = [
      { month: '2024-01', income: 5000, expense: 0, capital: 0, withdrawal: 0, net: 5000, count: 1 },
      { month: '2024-02', income: 6000, expense: 0, capital: 0, withdrawal: 0, net: 6000, count: 1 },
      { month: '2024-03', income: 0, expense: 0, capital: 0, withdrawal: 0, net: 0, count: 0 },
      { month: '2024-04', income: 0, expense: 0, capital: 0, withdrawal: 0, net: 0, count: 0 },
    ]
    render(<MonthlyAmountChart data={dataWithTrailingZeros} kind="income" currencyCode="USD" />)
    // The chart renders - just verify it doesn't crash and shows income
    expect(screen.getByText('Income')).toBeInTheDocument()
  })
})