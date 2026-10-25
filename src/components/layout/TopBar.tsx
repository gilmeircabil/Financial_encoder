import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSettings } from '../../contexts/SettingsContext'
import { formatDate } from '../../utils/dates'
import { Icon, type IconName } from '../ui/Icon'
import type { TransactionType } from '../../../electron/types/ipc'

interface TopBarProps {
  onOpenAddTransaction?: (type?: TransactionType) => void
}

const TRANSACTION_TYPES: Array<{ type: TransactionType; label: string; icon: IconName }> = [
  { type: 'income', label: 'Income', icon: 'income' },
  { type: 'expense', label: 'Expense', icon: 'expenses' },
  { type: 'capital', label: 'Capital Contribution', icon: 'capital' },
  { type: 'withdrawal', label: 'Withdrawal', icon: 'arrowDown' },
  { type: 'asset', label: 'Asset', icon: 'arrowUpRight' },
  { type: 'liability', label: 'Liability', icon: 'wallet' },
]

function TopBar({ onOpenAddTransaction }: TopBarProps): React.JSX.Element {
  const { settings, setSetting } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const [now, setNow] = useState(() => new Date())
  const [query, setQuery] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentTheme = settings?.theme ?? 'system'
  const isDark =
    currentTheme === 'dark' ||
    (currentTheme === 'system' &&
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  const handleToggleTheme = (): void => {
    void setSetting('theme', isDark ? 'light' : 'dark')
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  // Keyboard shortcut Ctrl+N (or Cmd+N) to toggle New dropdown
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setNewOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!newOpen) return
    const onDocClick = (e: MouseEvent): void => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setNewOpen(false)
      }
    }
    const onDocKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setNewOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onDocKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onDocKey)
    }
  }, [newOpen])

  const dateFormat = settings?.dateFormat ?? 'YYYY-MM-DD'
  const dateLabel = formatDate(now, dateFormat)
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'
  const appName = settings?.appName || 'Acorn'

  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard'

  const getPageInfo = (): { title: string; subtitle: string } => {
    if (isDashboard) {
      return { title: `${greeting}!`, subtitle: appName }
    }
    const path = location.pathname
    if (path.startsWith('/transactions')) return { title: 'Transactions', subtitle: appName }
    if (path.startsWith('/cash-flow')) return { title: 'Cash Flow', subtitle: appName }
    if (path.startsWith('/income')) return { title: 'Income', subtitle: appName }
    if (path.startsWith('/expenses')) return { title: 'Expenses', subtitle: appName }
    if (path.startsWith('/capital')) return { title: 'Capital & Equity', subtitle: appName }
    if (path.startsWith('/reports')) return { title: 'Reports & Export', subtitle: appName }
    if (path.startsWith('/documents')) return { title: 'Documents (OCR)', subtitle: appName }
    if (path.startsWith('/import')) return { title: 'Import Data', subtitle: appName }
    if (path.startsWith('/settings')) return { title: 'Settings', subtitle: appName }
    return { title: appName, subtitle: 'Local Vault' }
  }

  const { title: headingTitle, subtitle: headingSubtitle } = getPageInfo()

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/transactions?q=${encodeURIComponent(q)}` : '/transactions')
    setQuery('')
  }

  return (
    <header className="topbar">
      <div className="topbar__greeting">
        <span className="topbar__greeting-title">{headingTitle}</span>
        <span className="topbar__greeting-sub">{headingSubtitle}</span>
      </div>

      <form className="topbar__search" role="search" onSubmit={handleSearchSubmit}>
        <span className="topbar__search-icon" aria-hidden="true">
          <Icon name="search" size={15} />
        </span>
        <input
          id="global-search-input"
          type="search"
          className="topbar__search-input"
          placeholder="Search transactions…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search transactions"
          spellCheck={false}
        />
        {query ? (
          <button
            type="button"
            className="topbar__search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <Icon name="x" size={13} />
          </button>
        ) : null}
      </form>

      <div className="topbar__right">
        {onOpenAddTransaction && (
          <div className="app-dropdown" ref={dropdownRef}>
            <button
              type="button"
              className="btn btn--primary btn--sm topbar__add-btn"
              onClick={() => setNewOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={newOpen}
              title="Add transaction (Ctrl+N)"
            >
              <Icon name="plus" size={14} />
              <span>New</span>
              <Icon name="chevronDown" size={12} />
            </button>
            {newOpen && (
              <div className="app-dropdown__menu" role="menu" aria-label="New transaction types">
                {TRANSACTION_TYPES.map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    className="app-dropdown__item"
                    role="menuitem"
                    onClick={() => {
                      setNewOpen(false)
                      onOpenAddTransaction(t.type)
                    }}
                  >
                    <Icon name={t.icon} size={15} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <time className="topbar__date" dateTime={now.toISOString()} title={now.toLocaleTimeString()}>
          <Icon name="calendar" size={13} />
          <span>{dateLabel}</span>
        </time>

        <button
          type="button"
          className="topbar__theme-pill"
          onClick={handleToggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <span className={`topbar__theme-pill-opt${!isDark ? ' topbar__theme-pill-opt--active' : ''}`}>
            <Icon name="sun" size={14} />
          </span>
          <span className={`topbar__theme-pill-opt${isDark ? ' topbar__theme-pill-opt--active' : ''}`}>
            <Icon name="moon" size={14} />
          </span>
        </button>
      </div>
    </header>
  )
}

export default TopBar
