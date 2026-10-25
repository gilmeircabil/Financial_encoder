import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import TransactionForm from '../transactions/TransactionForm'
import { useToast } from '../../contexts/ToastContext'
import type { Transaction, TransactionType } from '../../../electron/types/ipc'

function AppShell(): React.JSX.Element {
  const { success } = useToast()

  const [addTxOpen, setAddTxOpen] = useState(false)
  const [addTxType, setAddTxType] = useState<TransactionType>('expense')

  const openGlobalAdd = (type: TransactionType = 'expense'): void => {
    setAddTxType(type)
    setAddTxOpen(true)
  }

  const handleGlobalTxSaved = (saved: Transaction): void => {
    setAddTxOpen(false)
    success(`Transaction "${saved.description}" saved!`)
    window.dispatchEvent(new CustomEvent('transaction-saved', { detail: saved }))
  }

  return (
    <div className="app-shell">
      <Sidebar
        onQuickAddIncome={() => openGlobalAdd('income')}
        onQuickAddExpense={() => openGlobalAdd('expense')}
      />
      <div className="app-shell__main">
        <TopBar
          onOpenAddTransaction={() => openGlobalAdd('expense')}
        />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>

      <TransactionForm
        open={addTxOpen}
        defaultType={addTxType}
        transaction={null}
        onClose={() => setAddTxOpen(false)}
        onSaved={handleGlobalTxSaved}
      />
    </div>
  )
}

export default AppShell
