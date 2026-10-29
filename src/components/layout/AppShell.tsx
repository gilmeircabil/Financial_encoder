import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import TransactionForm from '../transactions/TransactionForm'
import { AssistantFAB, AssistantDrawer } from '../assistant'
import { useToast } from '../../contexts/ToastContext'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import type { Transaction, TransactionType } from '../../../electron/types/ipc'

function AppShell(): React.JSX.Element {
  const { success } = useToast()
  const location = useLocation()
  const contentRef = useRef<HTMLElement>(null)

  const [addTxOpen, setAddTxOpen] = useState(false)
  const [addTxType, setAddTxType] = useState<TransactionType>('expense')
  const [assistantOpen, setAssistantOpen] = useState(false)

  // Global assistant hotkey: Ctrl+J
  useKeyboardShortcuts({
    onAssistant: () => setAssistantOpen((prev) => !prev),
  })

  // Reset scroll to top on page navigation
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [location.pathname])

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
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar />
      <div className="app-shell__main">
        <TopBar
          onOpenAddTransaction={(type) => openGlobalAdd(type ?? 'expense')}
          onToggleAssistant={() => setAssistantOpen((prev) => !prev)}
        />
        <main ref={contentRef} id="main-content" className="app-shell__content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <AssistantFAB
        isOpen={assistantOpen}
        onToggle={() => setAssistantOpen((prev) => !prev)}
      />

      <AssistantDrawer
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />

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
