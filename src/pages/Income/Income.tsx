import LedgerPage from '../../components/ledger/LedgerPage'

export default function Income(): React.JSX.Element {
  return (
    <LedgerPage
      type="income"
      pageClass="income-page"
      title="Income"
      description="Track all revenue streams, recurring earnings, and income source breakdown."
      addLabel="Add Income"
      statLabel="Total Income"
      statSubtext={(count) => `Across ${count} transactions`}
      topCategoryLabel="Top Source"
      categoriesTitle="Category Distribution"
      emptyCategoryMessage="No income category breakdown available."
      chartTitle="Monthly Income History"
      recordsTitle="Income Transactions"
      emptyState={{
        icon: 'income',
        title: 'No income transactions found',
        description: 'Start logging your income to track earnings over time.',
        buttonText: '+ Add Income',
      }}
      amountPrefix="+"
      amountClass="cf-positive"
      deleteTitle="Delete Income Transaction"
      deleteSubject="income record"
      exportSuccessMessage="Income ledger exported to CSV!"
    />
  )
}
