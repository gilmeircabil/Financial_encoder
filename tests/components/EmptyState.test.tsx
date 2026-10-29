import { describe, expect, it, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import EmptyState from '../../src/components/ui/EmptyState'

afterEach(() => {
  cleanup()
})

describe('EmptyState', () => {
  it('renders icon, title, and description', () => {
    render(
      <EmptyState icon="documents" title="No transactions" description="Start by adding your first transaction." />
    )
    expect(screen.getByText('No transactions')).toBeInTheDocument()
    expect(screen.getByText('Start by adding your first transaction.')).toBeInTheDocument()
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const handleClick = vi.fn()
    render(
      <EmptyState
        icon="documents"
        title="No transactions"
        description="Start by adding your first transaction."
      >
        <button onClick={handleClick}>Add Transaction</button>
      </EmptyState>
    )
    const button = screen.getByRole('button', { name: 'Add Transaction' })
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders description as ReactNode', () => {
    render(
      <EmptyState
        icon="documents"
        title="No transactions"
        description={<span data-testid="custom-desc">Custom <strong>description</strong></span>}
      />
    )
    expect(screen.getByTestId('custom-desc')).toBeInTheDocument()
    expect(screen.getByText('Custom')).toBeInTheDocument()
    expect(screen.getByText('description')).toBeInTheDocument()
  })

  it('applies correct classes', () => {
    const { container } = render(
      <EmptyState icon="documents" title="No transactions" description="Description" />
    )
    const emptyState = container.querySelector('.empty-state')
    expect(emptyState).toBeInTheDocument()
  })

  it('renders without description when not provided', () => {
    render(<EmptyState icon="documents" title="No transactions" />)
    expect(screen.getByText('No transactions')).toBeInTheDocument()
  })

  it('renders without action when not provided', () => {
    render(<EmptyState icon="documents" title="No transactions" description="Description" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})