import { describe, expect, it, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { MemoryRouter } from 'react-router-dom'
import { SettingsProvider } from '../src/contexts/SettingsContext'
import KpiCard from '../src/components/ui/KpiCard'
import EmptyState from '../src/components/ui/EmptyState'
import PageHeader from '../src/components/ui/PageHeader'
import { TransactionTable } from '../src/components/tables/TransactionTable'
import CashFlowChart from '../src/components/charts/CashFlowChart'
import MonthlyAmountChart from '../src/components/charts/MonthlyAmountChart'
import CategoryProgressList from '../src/components/ui/CategoryProgressList'
import TopBar from '../src/components/layout/TopBar'
import type { CalculationType } from '../electron/calculations/types'

afterEach(() => {
  cleanup()
})

const mockTransactionColumns = [
  { key: 'date', label: 'Date', sortable: true },
  { key: 'description', label: 'Description', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'type', label: 'Type' },
  { key: 'category_name', label: 'Category' },
]

const mockTransactionData = [
  { id: 1, date: '2024-01-15', description: 'Salary', amount: 5000, type: 'income', category_name: 'Salary' },
  { id: 2, date: '2024-01-16', description: 'Groceries', amount: 150.75, type: 'expense', category_name: 'Food' },
]

const mockCashFlowData = [
  { key: '2024-01', income: 5000, expense: 3000 },
  { key: '2024-02', income: 6000, expense: 4000 },
]

const mockMonthlyData: Array<{ month: string; income: number; expense: number; capital: number; withdrawal: number; net: number; count: number }> = [
  { month: '2024-01', income: 5000, expense: 3000, capital: 1000, withdrawal: 500, net: 2500, count: 5 },
  { month: '2024-02', income: 6000, expense: 4000, capital: 2000, withdrawal: 800, net: 3200, count: 6 },
]

const mockCategoryItems: Array<{ category_id: number; category_name: string; total: number; count: number; type: CalculationType }> = [
  { category_id: 1, category_name: 'Salary', total: 5000, count: 1, type: 'income' },
  { category_id: 2, category_name: 'Food', total: 1500, count: 3, type: 'expense' },
]

describe('Accessibility Tests (axe-core)', () => {
  describe('KpiCard', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<KpiCard label="Total Income" value={12345.67} currencyCode="USD" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations with trend indicator', async () => {
      const { container } = render(
        <KpiCard label="Total Income" value={12345.67} currencyCode="USD" trend={0.15} trendLabel="vs last month" />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('EmptyState', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <EmptyState icon="documents" title="No transactions" description="Start by adding your first transaction." />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('PageHeader', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <PageHeader title="Test Page" description="Page description" />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('TransactionTable', () => {
    it('should have no accessibility violations with basic data', async () => {
      const { container } = render(
        <TransactionTable columns={mockTransactionColumns} data={mockTransactionData} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations with selection enabled', async () => {
      const { container } = render(
        <TransactionTable
          columns={mockTransactionColumns}
          data={mockTransactionData}
          selection={new Set([1])}
          onToggleSelect={vi.fn()}
          onToggleSelectAll={vi.fn()}
          allSelected={false}
          someSelected={true}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('CashFlowChart', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<CashFlowChart data={mockCashFlowData} currencyCode="USD" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('MonthlyAmountChart', () => {
    it('should have no accessibility violations for income', async () => {
      const { container } = render(<MonthlyAmountChart data={mockMonthlyData} kind="income" currencyCode="USD" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('CategoryProgressList', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<CategoryProgressList items={mockCategoryItems} currencyCode="USD" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('TopBar', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <MemoryRouter>
          <SettingsProvider>
            <TopBar onOpenAddTransaction={vi.fn()} />
          </SettingsProvider>
        </MemoryRouter>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})