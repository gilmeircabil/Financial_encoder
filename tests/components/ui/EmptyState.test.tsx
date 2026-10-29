import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmptyState from '../../../src/components/ui/EmptyState'

vi.mock('electron', () => ({
  app: {
    getPath: () => '/mock/path',
  },
}))

describe('EmptyState', () => {
  it('renders with icon, title, and description', () => {
    render(
      <EmptyState icon="transactions" title="No transactions recorded" description="Get started by creating your first transaction." />
    )
    expect(screen.getByText('No transactions recorded')).toBeDefined()
    expect(screen.getByText('Get started by creating your first transaction.')).toBeDefined()
  })

  it('renders without icon', () => {
    render(
      <EmptyState title="No data" description="There is no data to display." />
    )
    expect(screen.getByText('No data')).toBeDefined()
    expect(screen.getByText('There is no data to display.')).toBeDefined()
  })

  it('renders with action children', () => {
    render(
      <EmptyState title="No income" description="Start logging your income.">
        <button className="btn btn--secondary">Add Income</button>
      </EmptyState>
    )
    expect(screen.getByText('Add Income')).toBeDefined()
  })

  it('renders with compact feel via description only', () => {
    render(
      <EmptyState icon="income" title="No income recorded" description="Start logging your income to track earnings." />
    )
    expect(screen.getByText('No income recorded')).toBeDefined()
    expect(screen.getByText('Start logging your income to track earnings.')).toBeDefined()
  })
})