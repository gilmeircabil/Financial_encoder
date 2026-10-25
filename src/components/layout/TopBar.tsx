import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../../contexts/SettingsContext'
import { formatDate } from '../../utils/dates'
import { Icon } from '../ui/Icon'

interface TopBarProps {
  onOpenAddTransaction?: () => void
}

function TopBar({ onOpenAddTransaction }: TopBarProps): React.JSX.Element {
  const { settings, setSetting } = useSettings()
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [query, setQuery] = useState('')

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

  const dateFormat = settings?.dateFormat ?? 'YYYY-MM-DD'
  const dateLabel = formatDate(now, dateFormat)
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'
  const appName = settings?.appName || 'Acorn'

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/transactions?q=${encodeURIComponent(q)}` : '/transactions')
    setQuery('')
  }

  return (
    <header className="topbar">
      <div className="topbar__greeting">
        <span className="topbar__greeting-title">{greeting}!</span>
        <span className="topbar__greeting-sub">{appName}</span>
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
          <button
            type="button"
            className="btn btn--primary btn--sm topbar__add-btn"
            onClick={onOpenAddTransaction}
            title="Add transaction"
          >
            <Icon name="plus" size={14} />
            <span>New</span>
          </button>
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

        <button
          type="button"
          className="topbar__icon-btn"
          onClick={() => navigate('/settings')}
          aria-label="Open settings"
          title="Settings"
        >
          <Icon name="settings" size={17} />
        </button>
      </div>
    </header>
  )
}

export default TopBar