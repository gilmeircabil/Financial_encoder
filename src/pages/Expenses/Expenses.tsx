import LedgerPage from '../../components/ledger/LedgerPage'

export default function Expenses(): React.JSX.Element {
  return (
    <LedgerPage
      type="expense"
      pageClass="expenses-page"
      title="Expenses"
      description="Track, categorize, and analyze operating and personal expenditures."
      addLabel="Add Expense"
      statLabel="Total Expenses"
      statSubtext={(count) => `Across ${count} transactions`}
      topCategoryLabel="Top Expense Category"
      categoriesTitle="Category Distribution"
      emptyCategoryMessage="No expense category breakdown available."
      chartTitle="Monthly Expense History"
      recordsTitle="Expense Transactions"
      emptyState={{
        icon: 'expenses',
        title: 'No expense transactions found',
        description: 'Start logging your expenses to track spending over time.',
        buttonText: '+ Add Expense',
      }}
      amountPrefix="-"
      amountClass="cf-negative"
      deleteTitle="Delete Expense Transaction"
      deleteSubject="expense record"
      exportSuccessMessage="Expense ledger exported to CSV!"
    />
  )
}
