import LedgerPage from '../../components/ledger/LedgerPage'
import { TransactionColumn } from '../../components/tables/TransactionTable'
import type { Transaction } from '../../../electron/types/ipc'

const incomeColumns: TransactionColumn[] = [
  { key: 'date', label: 'Date', className: 'tx-cell-date' },
  { key: 'description', label: 'Description', className: 'tx-cell-desc' },
  { key: 'category', label: 'Category', className: 'tx-cell-cat' },
  { key: 'amount', label: 'Amount', className: 'tx-table__amount' },
]

export default function Income(): React.JSX.Element {
  return (
    <LedgerPage
      type="income"
      title="Income"
      description="Track all revenue streams, recurring earnings, and income source breakdown."
      statLabel="Total Income"
      statSubtext={(count) => count === 1 ? '1 transaction' : `${count} transactions`}
      topCategoryLabel="Top Source"
      categoriesTitle="Category Distribution"
      emptyCategoryMessage="No income category breakdown available."
      chartTitle="Monthly Income History"
      recordsTitle="Income Transactions"
      emptyState={{
        icon: 'income',
        title: 'No income transactions found',
        description: 'Start logging your income to track earnings over time.',
      }}
      deleteTitle="Delete Income Transaction"
      deleteSubject="income record"
      exportSuccessMessage="Income ledger exported to CSV!"
      kpiIcon="arrowUp"
      totalKpiVariant="positive"
      tableColumns={incomeColumns}
      transformRow={(tx: Transaction) => ({
        id: tx.id,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        type: 'income',
        category_name: tx.category_name,
      })}
    />
  )
}