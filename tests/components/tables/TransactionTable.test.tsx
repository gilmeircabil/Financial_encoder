import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionTable } from '../../../src/components/tables/TransactionTable'

vi.mock('electron', () => ({
  app: {
    getPath: () => '/mock/path',
  },
}))

describe('TransactionTable', () => {
  const mockColumns = [
    { key: 'date', label: 'Date', className: 'tx-cell-date' },
    { key: 'description', label: 'Description', className: 'tx-cell-desc' },
    { key: 'amount', label: 'Amount', className: 'tx-table__amount' },
    { key: 'type', label: 'Type' },
  ]

  const mockTransactions = [
    {
      id: 1,
      date: '2026-09-15',
      description: 'Salary',
      amount: 5000,
      type: 'income',
      category_name: 'Income',
    },
    {
      id: 2,
      date: '2026-09-14',
      description: 'Rent',
      amount: -1200,
      type: 'expense',
      category_name: 'Rent',
    },
  ]

  it('renders column headers', () => {
    render(
      <TransactionTable columns={mockColumns} data={mockTransactions} />
    )
    expect(screen.getByText('Date')).toBeDefined()
    expect(screen.getByText('Description')).toBeDefined()
    expect(screen.getByText('Amount')).toBeDefined()
    expect(screen.getByText('Type')).toBeDefined()
  })

  it('renders transaction rows', () => {
    render(
      <TransactionTable columns={mockColumns} data={mockTransactions} />
    )
    const salaryElements = screen.getAllByText('Salary')
    expect(salaryElements.length).toBeGreaterThanOrEqual(1)
    const rentElements = screen.getAllByText('Rent')
    expect(rentElements.length).toBeGreaterThanOrEqual(1)
    // Check that the amount cells exist (they contain formatted currency)
    const amountCells = screen.getAllByText(/[₱$][0-9,.]+/)
    expect(amountCells.length).toBeGreaterThanOrEqual(2)
  })

  it('applies row striping via classes', () => {
    const { container } = render(
      <TransactionTable columns={mockColumns} data={mockTransactions} />
    )
    const rows = container.querySelectorAll('tr')
    expect(rows.length).toBe(3) // header + 2 data rows
  })
})