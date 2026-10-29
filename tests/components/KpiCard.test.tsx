import { describe, expect, it, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import KpiCard from '../../src/components/ui/KpiCard'

afterEach(() => {
  cleanup()
})

describe('KpiCard', () => {
  it('renders label and formatted value', () => {
    render(<KpiCard label="Test Label" value={12345.67} currencyCode="USD" />)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByText('$12,345.67')).toBeInTheDocument()
  })

  it('renders with compact mode', () => {
    render(<KpiCard label="Test Label" value={1234567} currencyCode="USD" compact />)
    expect(screen.getByText('$1.2M')).toBeInTheDocument()
  })

  it('applies positive variant class', () => {
    render(<KpiCard label="Test Label" value={12345.67} currencyCode="USD" variant="positive" />)
    const valueEl = screen.getByText('$12,345.67').closest('.stat-card__value')
    expect(valueEl).toHaveClass('stat-card__value--positive')
  })

  it('applies negative variant class', () => {
    render(<KpiCard label="Test Label" value={-5000} currencyCode="USD" variant="negative" />)
    const valueEl = screen.getByText('-$5,000.00').closest('.stat-card__value')
    expect(valueEl).toHaveClass('stat-card__value--negative')
  })

  it('applies ok/warn/danger badge variants', () => {
    const { unmount } = render(<KpiCard label="Test Label OK" value={12345.67} currencyCode="USD" variant="ok" />)
    expect(screen.getByRole('region', { name: 'Test Label OK' })).toHaveClass('card')
    unmount()

    render(<KpiCard label="Test Label Warn" value={12345.67} currencyCode="USD" variant="warn" />)
    expect(screen.getByRole('region', { name: 'Test Label Warn' })).toHaveClass('card')
    unmount()

    render(<KpiCard label="Test Label Danger" value={12345.67} currencyCode="USD" variant="danger" />)
    expect(screen.getByRole('region', { name: 'Test Label Danger' })).toHaveClass('card')
  })

  it('renders icon when provided', () => {
    render(<KpiCard label="Test Label" value={12345.67} currencyCode="USD" icon="arrowUp" />)
    const region = screen.getByRole('region', { name: 'Test Label' })
    expect(region).toBeInTheDocument()
    const svg = region.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders trend indicator with percentage', () => {
    render(<KpiCard label="Test Label" value={12345.67} currencyCode="USD" trend={0.15} trendLabel="vs last month" />)
    expect(screen.getByText('+15.0%')).toBeInTheDocument()
    expect(screen.getByText('vs last month')).toBeInTheDocument()
  })

  it('renders negative trend with danger badge', () => {
    render(<KpiCard label="Test Label" value={12345.67} currencyCode="USD" trend={-0.08} />)
    expect(screen.getByText('-8.0%')).toBeInTheDocument()
    const badge = screen.getByText('-8.0%').closest('.stat-card__badge')
    expect(badge).toHaveClass('stat-card__badge--danger')
  })

  it('renders trendLabel without trend as subtext', () => {
    render(<KpiCard label="Test Label" value={12345.67} currencyCode="USD" trendLabel="Gross revenue inflows" />)
    expect(screen.getByText('Gross revenue inflows')).toBeInTheDocument()
    const subtext = screen.getByText('Gross revenue inflows').closest('.stat-card__subtext')
    expect(subtext).toBeInTheDocument()
  })

  it('uses displayValue when provided', () => {
    render(<KpiCard label="Test Label" value={12345.67} currencyCode="USD" displayValue="1.85x" />)
    expect(screen.getByText('1.85x')).toBeInTheDocument()
  })

  it('renders action link with aria-label', () => {
    render(<KpiCard label="Test Label" value={12345.67} currencyCode="USD" actionLink="/reports" actionAriaLabel="View reports" />)
    const link = screen.getByRole('link', { name: 'View reports' })
    expect(link).toHaveAttribute('href', '/reports')
  })

  it('has accessible region with aria-label', () => {
    render(<KpiCard label="Test Label" value={12345.67} currencyCode="USD" />)
    const region = screen.getByRole('region', { name: 'Test Label' })
    expect(region).toBeInTheDocument()
  })

  it('formats currency correctly for different codes', () => {
    const { unmount } = render(<KpiCard label="Test Label" value={12345.67} currencyCode="PHP" />)
    expect(screen.getByText('₱12,345.67')).toBeInTheDocument()
    unmount()

    render(<KpiCard label="Test Label" value={12345.67} currencyCode="EUR" />)
    expect(screen.getByText('€12,345.67')).toBeInTheDocument()
    unmount()

    render(<KpiCard label="Test Label" value={12345.67} currencyCode="GBP" />)
    expect(screen.getByText('£12,345.67')).toBeInTheDocument()
  })

  it('handles zero value', () => {
    render(<KpiCard label="Test Label" value={0} currencyCode="USD" />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('handles negative value with negative variant', () => {
    render(<KpiCard label="Test Label" value={-1000} currencyCode="USD" variant="negative" />)
    expect(screen.getByText('-$1,000.00')).toBeInTheDocument()
    const valueEl = screen.getByText('-$1,000.00').closest('.stat-card__value')
    expect(valueEl).toHaveClass('stat-card__value--negative')
  })
})