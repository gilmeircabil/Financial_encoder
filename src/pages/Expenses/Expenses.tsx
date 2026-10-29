import LedgerPage from '../../components/ledger/LedgerPage'
import { TransactionColumn } from '../../components/tables/TransactionTable'
import type { Transaction } from '../../../electron/types/ipc'

const expenseColumns: TransactionColumn[] = [
  { key: 'date', label: 'Date', className: 'tx-cell-date' },
  { key: 'description', label: 'Description', className: 'tx-cell-desc' },
  { key: 'category', label: 'Category', className: 'tx-cell-cat' },
  { key: 'amount', label: 'Amount', className: 'tx-table__amount' },
]

export default function Expenses(): React.JSX.Element {
  return (
    <LedgerPage
      type="expense"
      title="Expenses"
      description="Track, categorize, and analyze operating and personal expenditures."
      statLabel="Total Expenses"
      statSubtext={(count) => count === 1 ? '1 transaction' : `${count} transactions`}
      topCategoryLabel="Top Expense Category"
      categoriesTitle="Category Distribution"
      emptyCategoryMessage="No expense category breakdown available."
      chartTitle="Monthly Expense History"
      recordsTitle="Expense Transactions"
      emptyState={{
        icon: 'expenses',
        title: 'No expense transactions found',
        description: 'Start logging your expenses to track spending over time.',
      }}
      deleteTitle="Delete Expense Transaction"
      deleteSubject="expense record"
      exportSuccessMessage="Expense ledger exported to CSV!"
      kpiIcon="arrowDown"
      totalKpiVariant="negative"
      tableColumns={expenseColumns}
      transformRow={(tx: Transaction) => ({
        id: tx.id,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        type: 'expense',
        category_name: tx.category_name,
      })}
    />
  )
}