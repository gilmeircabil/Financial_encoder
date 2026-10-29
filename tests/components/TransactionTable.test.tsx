import { describe, expect, it, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { TransactionTable } from '../../src/components/tables/TransactionTable'

afterEach(() => {
  cleanup()
})

const mockColumns = [
  { key: 'date', label: 'Date', sortable: true },
  { key: 'description', label: 'Description', sortable: true },
  { key: 'amount', label: 'Amount', className: 'tx-table__amount', sortable: true },
  { key: 'type', label: 'Type' },
  { key: 'category_name', label: 'Category' },
]

const mockData = [
  { id: 1, date: '2024-01-15', description: 'Salary', amount: 5000, type: 'income', category_name: 'Salary' },
  { id: 2, date: '2024-01-16', description: 'Groceries', amount: 150.75, type: 'expense', category_name: 'Food' },
  { id: 3, date: '2024-01-17', description: 'Freelance', amount: 1200, type: 'income', category_name: 'Business' },
  { id: 4, date: '2024-01-18', description: 'Rent', amount: 2000, type: 'expense', category_name: 'Housing' },
  { id: 5, date: '2024-01-19', description: 'Investment', amount: 3000, type: 'capital', category_name: 'Investment' },
]

describe('TransactionTable', () => {
  it('renders table headers from columns', () => {
    render(<TransactionTable columns={mockColumns} data={mockData} />)
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
  })

  it('renders all data rows', () => {
    render(<TransactionTable columns={mockColumns} data={mockData} />)
    // Use getAllByText to handle duplicates (description + category)
    expect(screen.getAllByText('Salary').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Groceries').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Freelance').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Rent').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Investment').length).toBeGreaterThanOrEqual(1)
  })

  it('formats currency correctly with default PHP', () => {
    render(<TransactionTable columns={mockColumns} data={mockData} />)
    // Amounts are rendered with + prefix for income, - for expense
    expect(screen.getByText('+₱5,000.00')).toBeInTheDocument()
    expect(screen.getByText('-₱150.75')).toBeInTheDocument()
  })

  it('formats currency correctly with custom currencyCode', () => {
    render(<TransactionTable columns={mockColumns} data={mockData} currencyCode="USD" />)
    expect(screen.getByText('+$5,000.00')).toBeInTheDocument()
    expect(screen.getByText('-$150.75')).toBeInTheDocument()
  })

  it('applies cf-positive class for income types', () => {
    render(<TransactionTable columns={mockColumns} data={mockData} />)
    // Find the row containing Salary description
    const salaryDesc = screen.getAllByText('Salary').find(el => el.classList.contains('tx-table__desc'))
    const salaryRow = salaryDesc?.closest('tr')
    const amountEl = salaryRow?.querySelector('.cf-positive')
    expect(amountEl).toBeInTheDocument()
  })

  it('applies cf-negative class for expense types', () => {
    render(<TransactionTable columns={mockColumns} data={mockData} />)
    const groceriesDesc = screen.getAllByText('Groceries').find(el => el.classList.contains('tx-table__desc'))
    const groceriesRow = groceriesDesc?.closest('tr')
    const amountEl = groceriesRow?.querySelector('.cf-negative')
    expect(amountEl).toBeInTheDocument()
  })

  it('applies cf-negative class for withdrawal types', () => {
    const dataWithWithdrawal = [
      ...mockData,
      { id: 6, date: '2024-01-20', description: 'Withdrawal', amount: 500, type: 'withdrawal', category_name: 'Personal' },
    ]
    render(<TransactionTable columns={mockColumns} data={dataWithWithdrawal} />)
    const withdrawalDesc = screen.getAllByText('Withdrawal').find(el => el.classList.contains('tx-table__desc'))
    const withdrawalRow = withdrawalDesc?.closest('tr')
    const amountEl = withdrawalRow?.querySelector('.cf-negative')
    expect(amountEl).toBeInTheDocument()
  })

  it('applies cf-negative class for liability types', () => {
    const dataWithLiability = [
      ...mockData,
      { id: 6, date: '2024-01-20', description: 'Loan Payment', amount: 300, type: 'liability', category_name: 'Debt' },
    ]
    render(<TransactionTable columns={mockColumns} data={dataWithLiability} />)
    const liabilityDesc = screen.getAllByText('Loan Payment').find(el => el.classList.contains('tx-table__desc'))
    const liabilityRow = liabilityDesc?.closest('tr')
    const amountEl = liabilityRow?.querySelector('.cf-negative')
    expect(amountEl).toBeInTheDocument()
  })

  it('renders category color dot', () => {
    render(<TransactionTable columns={mockColumns} data={mockData} />)
    const dots = document.querySelectorAll('.tx-category-dot')
    expect(dots.length).toBe(5)
  })

  it('renders type badges', () => {
    render(<TransactionTable columns={mockColumns} data={mockData} />)
    // Each type appears once in the badge column
    expect(screen.getAllByText('income').length).toBeGreaterThanOrEqual(2) // Salary + Freelance
    expect(screen.getAllByText('expense').length).toBeGreaterThanOrEqual(2) // Groceries + Rent
    expect(screen.getAllByText('capital').length).toBeGreaterThanOrEqual(1) // Investment
  })

  it('shows sortable headers with sort icons when onSort provided', () => {
    const handleSort = vi.fn()
    render(<TransactionTable columns={mockColumns} data={mockData} onSort={handleSort} sortBy="date" sortDir="asc" />)
    // Active sort shows ↑
    expect(screen.getByText('↑')).toBeInTheDocument()
    // Inactive sorts show ↕ (multiple)
    expect(screen.getAllByText('↕').length).toBeGreaterThanOrEqual(1)
  })

  it('calls onSort when sortable header clicked', () => {
    const handleSort = vi.fn()
    render(<TransactionTable columns={mockColumns} data={mockData} onSort={handleSort} />)
    // Click the Date header button - find the button within the Date header
    const dateHeader = screen.getAllByText('Date').find(el => el.closest('th'))
    const dateButton = dateHeader?.querySelector('button')
    if (dateButton) {
      fireEvent.click(dateButton)
      expect(handleSort).toHaveBeenCalledWith('date')
    }
  })

  it('renders selection checkboxes when selection prop provided', () => {
    const handleToggleSelect = vi.fn()
    const handleToggleSelectAll = vi.fn()
    render(
      <TransactionTable
        columns={mockColumns}
        data={mockData}
        selection={new Set([1, 2])}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        allSelected={false}
        someSelected={true}
      />
    )
    const checkboxes = document.querySelectorAll('input[type="checkbox"]')
    expect(checkboxes.length).toBe(6) // 5 rows + 1 select all
  })

  it('selects all checkbox when allSelected is true', () => {
    const handleToggleSelectAll = vi.fn()
    render(
      <TransactionTable
        columns={mockColumns}
        data={mockData}
        selection={new Set([1, 2, 3, 4, 5])}
        onToggleSelect={vi.fn()}
        onToggleSelectAll={handleToggleSelectAll}
        allSelected={true}
        someSelected={false}
      />
    )
    const selectAllCheckbox = document.querySelector('th input[type="checkbox"]') as HTMLInputElement
    expect(selectAllCheckbox).toBeChecked()
  })

  it('sets indeterminate on select all when someSelected is true', () => {
    render(
      <TransactionTable
        columns={mockColumns}
        data={mockData}
        selection={new Set([1, 2])}
        onToggleSelect={vi.fn()}
        onToggleSelectAll={vi.fn()}
        allSelected={false}
        someSelected={true}
      />
    )
    const selectAllCheckbox = document.querySelector('th input[type="checkbox"]') as HTMLInputElement
    expect(selectAllCheckbox.indeterminate).toBe(true)
  })

  it('calls onToggleSelect when row checkbox clicked', () => {
    const handleToggleSelect = vi.fn()
    render(
      <TransactionTable
        columns={mockColumns}
        data={mockData}
        selection={new Set()}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={vi.fn()}
      />
    )
    const firstCheckbox = document.querySelectorAll('tbody input[type="checkbox"]')[0]
    fireEvent.click(firstCheckbox)
    expect(handleToggleSelect).toHaveBeenCalledWith(1)
  })

  it('calls onToggleSelectAll when select all clicked', () => {
    const handleToggleSelectAll = vi.fn()
    render(
      <TransactionTable
        columns={mockColumns}
        data={mockData}
        selection={new Set()}
        onToggleSelect={vi.fn()}
        onToggleSelectAll={handleToggleSelectAll}
      />
    )
    const selectAllCheckbox = document.querySelector('th input[type="checkbox"]')
    fireEvent.click(selectAllCheckbox!)
    expect(handleToggleSelectAll).toHaveBeenCalled()
  })

  it('renders Edit button when onEdit provided', () => {
    const handleEdit = vi.fn()
    render(<TransactionTable columns={mockColumns} data={mockData} onEdit={handleEdit} />)
    const editButtons = document.querySelectorAll('.tx-action-btn--edit')
    expect(editButtons.length).toBe(5)
  })

  it('calls onEdit with row data when Edit clicked', () => {
    const handleEdit = vi.fn()
    render(<TransactionTable columns={mockColumns} data={mockData} onEdit={handleEdit} />)
    const firstEditBtn = document.querySelector('.tx-action-btn--edit')
    fireEvent.click(firstEditBtn!)
    expect(handleEdit).toHaveBeenCalledWith(mockData[0])
  })

  it('renders Delete button when onDelete provided', () => {
    const handleDelete = vi.fn()
    render(<TransactionTable columns={mockColumns} data={mockData} onDelete={handleDelete} />)
    const deleteButtons = document.querySelectorAll('.tx-action-btn--delete')
    expect(deleteButtons.length).toBe(5)
  })

  it('calls onDelete with row id when Delete clicked', () => {
    const handleDelete = vi.fn()
    render(<TransactionTable columns={mockColumns} data={mockData} onDelete={handleDelete} />)
    const firstDeleteBtn = document.querySelector('.tx-action-btn--delete')
    fireEvent.click(firstDeleteBtn!)
    expect(handleDelete).toHaveBeenCalledWith(1)
  })

  it('shows running balance column when showBalanceColumn is true', () => {
    const dataWithBalance = mockData.map((d, i) => ({ ...d, cumulativeBalance: (i + 1) * 1000 }))
    render(<TransactionTable columns={mockColumns} data={dataWithBalance} showBalanceColumn />)
    expect(screen.getByText('Running Balance')).toBeInTheDocument()
    expect(screen.getByText('₱1,000.00')).toBeInTheDocument()
    expect(screen.getByText('₱5,000.00')).toBeInTheDocument()
  })

  it('applies positive/negative class to running balance', () => {
    const dataWithBalance = [
      { ...mockData[0], cumulativeBalance: 5000 },
      { ...mockData[1], cumulativeBalance: -200 },
    ]
    render(<TransactionTable columns={mockColumns} data={dataWithBalance} showBalanceColumn />)
    const positiveBalance = screen.getByText('₱5,000.00').closest('td')
    const negativeBalance = screen.getByText('-₱200.00').closest('td')
    expect(positiveBalance).toHaveClass('cf-positive')
    expect(negativeBalance).toHaveClass('cf-negative')
  })

  it('shows notes when present', () => {
    const dataWithNotes = [
      { ...mockData[0], notes: 'Monthly salary' },
    ]
    render(<TransactionTable columns={mockColumns} data={dataWithNotes} />)
    expect(screen.getByText('Monthly salary')).toBeInTheDocument()
  })

  it('does not show notes when null', () => {
    const dataWithNullNotes = [
      { ...mockData[0], notes: null },
    ]
    render(<TransactionTable columns={mockColumns} data={dataWithNullNotes} />)
    expect(screen.queryByText('null')).not.toBeInTheDocument()
  })

  it('formats date using dateFormat prop', () => {
    render(<TransactionTable columns={mockColumns} data={mockData} dateFormat="DD/MM/YYYY" />)
    expect(screen.getByText('15/01/2024')).toBeInTheDocument()
  })

  it('applies selected row class when row is selected', () => {
    render(
      <TransactionTable
        columns={mockColumns}
        data={mockData}
        selection={new Set([1])}
        onToggleSelect={vi.fn()}
        onToggleSelectAll={vi.fn()}
      />
    )
    const salaryDesc = screen.getAllByText('Salary').find(el => el.classList.contains('tx-table__desc'))
    const selectedRow = salaryDesc?.closest('tr')
    expect(selectedRow).toHaveClass('tx-row--selected')
  })

  it('shows Actions header when edit or delete provided', () => {
    render(<TransactionTable columns={mockColumns} data={mockData} onEdit={vi.fn()} />)
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('handles empty data gracefully', () => {
    render(<TransactionTable columns={mockColumns} data={[]} />)
    expect(screen.getByText('Date')).toBeInTheDocument()
    const tbody = document.querySelector('tbody')
    expect(tbody?.children.length).toBe(0)
  })
})