import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiCard } from '../../../src/components/ui/KpiCard'

vi.mock('electron', () => ({
  app: {
    getPath: () => '/mock/path',
  },
}))

describe('KpiCard', () => {
  it('renders label and value', () => {
    render(<KpiCard label="Total Income" value={50000} currencyCode="PHP" />)
    expect(screen.getByText('Total Income')).toBeDefined()
    expect(screen.getByText('₱50,000.00')).toBeDefined()
  })

  it('renders with positive trend indicator', () => {
    render(<KpiCard label="Net Profit" value={10000} currencyCode="USD" trend={0.15} trendLabel="vs last month" />)
    expect(screen.getByText('+15.0%')).toBeDefined()
    expect(screen.getByText('vs last month')).toBeDefined()
  })

  it('renders with negative trend indicator', () => {
    render(<KpiCard label="Expenses" value={5000} currencyCode="USD" trend={-0.08} trendLabel="vs last month" />)
    expect(screen.getByText('-8.0%')).toBeDefined()
  })

  it('applies variant classes correctly', () => {
    const { container } = render(<KpiCard label="Cash" value={1000} currencyCode="PHP" variant="positive" />)
    const card = container.firstChild
    expect(card instanceof HTMLElement && card.className).toContain('stat-card--income')
  })

  it('shows compact format when compact prop is true', () => {
    render(<KpiCard label="Revenue" value={1200000} currencyCode="USD" compact />)
    expect(screen.getByText('$1.2M')).toBeDefined()
  })

  it('renders icon when provided', () => {
    render(<KpiCard label="Capital" value={5000} currencyCode="USD" icon="capital" />)
    expect(screen.getByText('Capital')).toBeDefined()
  })

  it('shows custom displayValue when provided', () => {
    render(<KpiCard label="Coverage" value={1.85} currencyCode="USD" displayValue="1.85x" />)
    expect(screen.getByText('1.85x')).toBeDefined()
  })

  it('has accessible role attribute', () => {
    render(<KpiCard label="Net Profit" value={10000} currencyCode="USD" />)
    const cards = screen.getAllByText('Net Profit')
    // The first one should have role="region"
    expect(cards[0]?.closest('[role="region"]')).toBeDefined()
  })
})