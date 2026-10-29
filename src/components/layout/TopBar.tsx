import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../../contexts/SettingsContext'
import { Icon, type IconName } from '../ui/Icon'
import type { TransactionType } from '../../../electron/types/ipc'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useFormattedDate } from '../../hooks/useFormattedDate'

interface TopBarProps {
  onOpenAddTransaction?: (type?: TransactionType) => void
  onToggleAssistant?: () => void
}

const TRANSACTION_TYPES: Array<{ type: TransactionType; label: string; icon: IconName }> = [
  { type: 'income', label: 'Income', icon: 'income' },
  { type: 'expense', label: 'Expense', icon: 'expenses' },
  { type: 'capital', label: 'Capital Contribution', icon: 'capital' },
  { type: 'withdrawal', label: 'Withdrawal', icon: 'arrowDown' },
  { type: 'asset', label: 'Asset', icon: 'arrowUpRight' },
  { type: 'liability', label: 'Liability', icon: 'wallet' },
]

function TopBar({ onOpenAddTransaction, onToggleAssistant }: TopBarProps): React.JSX.Element {
  const { settings, setSetting } = useSettings()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTransaction: onOpenAddTransaction ? () => setNewOpen((prev) => !prev) : undefined,
    onSearch: () => {
      const searchInput = document.getElementById('global-search-input') as HTMLInputElement
      searchInput?.focus()
    },
  })

  // Formatted date with auto-update
  const { formattedDate: dateLabel, currentDate: now } = useFormattedDate({
    dateFormat: settings?.dateFormat ?? 'YYYY-MM-DD',
    updateIntervalMs: 60_000,
  })

  const currentTheme = settings?.theme ?? 'system'
  const isDark =
    currentTheme === 'dark' ||
    (currentTheme === 'system' &&
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  const handleToggleTheme = useCallback((): void => {
    void setSetting('theme', isDark ? 'light' : 'dark')
  }, [isDark, setSetting])

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'
  const appName = settings?.appName || 'Acorn'

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>): void => {
      event.preventDefault()
      const q = query.trim()
      navigate(q ? `/transactions?q=${encodeURIComponent(q)}` : '/transactions')
      setQuery('')
    },
    [query, navigate],
  )

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

  return (
    <header className="topbar">
      <div className="topbar__greeting">
        <span className="topbar__greeting-title">{greeting}!</span>
        <span className="topbar__greeting-sub">{appName}</span>
      </div>

      <form className="topbar__search" role="search" onSubmit={handleSearchSubmit}>
        <label htmlFor="global-search-input" className="sr-only">
          Search transactions
        </label>
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
        {onToggleAssistant && (
          <button
            type="button"
            className="topbar__assistant-btn"
            onClick={onToggleAssistant}
            aria-label="Ask Local Assistant (Ctrl+J)"
            title="Ask Local Assistant (Ctrl+J)"
          >
            <Icon name="sparkles" size={14} />
            <span>Assistant</span>
          </button>
        )}

        {onOpenAddTransaction && (
          <div className="app-dropdown" ref={dropdownRef}>
            <button
              type="button"
              className="btn btn--primary btn--sm topbar__add-btn"
              onClick={() => setNewOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={newOpen}
              aria-label="New transaction (Ctrl+N)"
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
          <Icon name="calendar" size={13} aria-hidden="true" />
          <span>{dateLabel}</span>
        </time>

        <button
          type="button"
          className="topbar__theme-pill"
          onClick={handleToggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-pressed={isDark}
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <span className={`topbar__theme-pill-opt${!isDark ? ' topbar__theme-pill-opt--active' : ''}`}>
            <Icon name="sun" size={14} aria-hidden="true" />
          </span>
          <span className={`topbar__theme-pill-opt${isDark ? ' topbar__theme-pill-opt--active' : ''}`}>
            <Icon name="moon" size={14} aria-hidden="true" />
          </span>
        </button>
      </div>
    </header>
  )
}

export default TopBar