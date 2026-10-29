import LedgerPage from '../../components/ledger/LedgerPage'
import { TransactionColumn } from '../../components/tables/TransactionTable'
import type { Transaction } from '../../../electron/types/ipc'

const capitalColumns: TransactionColumn[] = [
  { key: 'date', label: 'Date', className: 'tx-cell-date' },
  { key: 'description', label: 'Description', className: 'tx-cell-desc' },
  { key: 'type', label: 'Type' },
  { key: 'category', label: 'Category', className: 'tx-cell-cat' },
  { key: 'amount', label: 'Amount', className: 'tx-table__amount' },
]

export default function Capital(): React.JSX.Element {
  return (
    <LedgerPage
      type="capital"
      title="Capital & Equity"
      description="Monitor owner investments, contributions, withdrawals and equity reserves."
      statLabel="Net Equity Balance"
      statSubtext={(count) => count === 0 ? 'Across 0 transactions' : count === 1 ? 'Across 1 transaction' : `Across ${count} transactions`}
      topCategoryLabel="Top Capital Category"
      categoriesTitle="Capital Allocations"
      emptyCategoryMessage="No capital category movements in range."
      chartTitle="Monthly Capital Injections"
      recordsTitle="Capital Records"
      emptyState={{
        icon: 'capital',
        title: 'No capital records',
        description: 'Log equity investments, capital additions, or owner withdrawals.',
      }}
      deleteTitle="Delete Capital Record"
      deleteSubject="capital record"
      exportSuccessMessage="Capital ledger exported to CSV!"
      kpiIcon="capital"
      totalKpiVariant="neutral"
      tableColumns={capitalColumns}
      transformRow={(tx: Transaction) => ({
        id: tx.id,
        date: tx.date,
        description: tx.description,
        amount: tx.type === 'withdrawal' ? -tx.amount : tx.amount,
        type: tx.type,
        category_name: tx.category_name,
      })}
    />
  )
}