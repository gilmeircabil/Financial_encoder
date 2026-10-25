import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { CURRENCIES, findCurrencyByCode, type CurrencyEntry } from '../../data/countryCurrency'
import { Icon } from './Icon'

interface CurrencySelectProps {
  value: string
  onChange: (code: string) => void
  disabled?: boolean
  placeholder?: string
}

function codeHue(code: string): number {
  let hash = 0
  for (let i = 0; i < code.length; i += 1) {
    hash = ((hash << 5) - hash + code.charCodeAt(i)) >>> 0
  }
  return hash % 360
}

function badgeStyle(code: string): CSSProperties {
  const hue = codeHue(code)
  return {
    backgroundColor: `hsl(${hue} 55% 42%)`,
    color: '#fff',
  }
}

function HighlightedText({ text, query }: { text: string; query: string }): React.JSX.Element {
  const q = query.trim()
  if (!q) {
    return <>{text}</>
  }
  const index = text.toLowerCase().indexOf(q.toLowerCase())
  if (index === -1) {
    return <>{text}</>
  }
  return (
    <>
      {text.slice(0, index)}
      <mark className="currency-select__match">{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  )
}

function CurrencySelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Search currency (e.g. USD, US Dollar, East Timor)…',
}: CurrencySelectProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()

  const current = useMemo(
    () => findCurrencyByCode(value) ?? CURRENCIES.find((c) => c.code === value.toUpperCase()),
    [value],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return CURRENCIES
    }
    const scored: { entry: CurrencyEntry; rank: number }[] = []
    for (const entry of CURRENCIES) {
      const code = entry.code.toLowerCase()
      const name = entry.name.toLowerCase()
      const displayName = entry.displayName.toLowerCase()
      const countryMatch = entry.countries.some((c) => c.toLowerCase().includes(q))

      let rank = -1
      if (code === q) rank = 0
      else if (code.startsWith(q)) rank = 1
      else if (displayName.includes(q)) rank = 2
      else if (name.includes(q)) rank = 3
      else if (countryMatch) rank = 4

      if (rank !== -1) {
        scored.push({ entry, rank })
      }
    }
    scored.sort((a, b) => a.rank - b.rank || a.entry.code.localeCompare(b.entry.code))
    return scored.map((s) => s.entry)
  }, [query])

  useEffect(() => {
    if (!open) {
      return
    }
    const onDocClick = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onDocKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
        inputRef.current?.blur()
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onDocKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onDocKey)
    }
  }, [open])

  useEffect(() => {
    setHighlighted(0)
  }, [query, open])

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlighted}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  const select = (entry: CurrencyEntry): void => {
    onChange(entry.code)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (!open || results.length === 0) {
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => (h + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => (h - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const entry = results[highlighted]
      if (entry) {
        select(entry)
      }
    } else if (e.key === 'Tab') {
      const entry = results[highlighted]
      if (entry) {
        select(entry)
      }
    }
  }

  const activeCode = (results[highlighted]?.code ?? current?.code ?? value).toUpperCase()

  return (
    <div ref={rootRef} className={`currency-select${open ? ' currency-select--open' : ''}`}>
      <div className="currency-select__input-row">
        <span className="currency-select__lead" aria-hidden="true">
          {open ? (
            <Icon name="search" size={15} />
          ) : (
            <span className="currency-select__badge" style={badgeStyle(activeCode)}>
              {current?.symbol ?? activeCode}
            </span>
          )}
        </span>
        <input
          ref={inputRef}
          type="text"
          className="currency-select__input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open && results.length > 0 ? `${listboxId}-${highlighted}` : undefined}
          value={open ? query : (current?.displayName ?? value.toUpperCase())}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!open) {
              setOpen(true)
            }
          }}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="currency-select__toggle"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((o) => !o)
          }}
          disabled={disabled}
          aria-label={open ? 'Close currency list' : 'Open currency list'}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              fill="currentColor"
              d={open
                ? 'M8 5.2 2.6 10.6 4 12l4-4 4 4 1.4-1.4L8 5.2Z'
                : 'M8 10.8 13.4 5.4 12 4l-4 4-4-4-1.4 1.4L8 10.8Z'}
            />
          </svg>
        </button>
      </div>
      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          className="currency-select__list"
          role="listbox"
          aria-label="Currencies"
        >
          {results.length === 0 ? (
            <li className="currency-select__empty">
              <Icon name="search" size={16} />
              No currencies match “{query}”
            </li>
          ) : (
            <>
              <li className="currency-select__count" aria-hidden="true">
                {query.trim() ? `${results.length} result${results.length === 1 ? '' : 's'}` : `${results.length} currencies`}
              </li>
              {results.map((entry, index) => {
                const isSelected = entry.code === value.toUpperCase()
                return (
                  <li
                    key={entry.code}
                    id={`${listboxId}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    className={`currency-select__option${index === highlighted ? ' currency-select__option--active' : ''}${isSelected ? ' currency-select__option--selected' : ''}`}
                    onMouseEnter={() => setHighlighted(index)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      select(entry)
                    }}
                  >
                    <span className="currency-select__badge" style={badgeStyle(entry.code)}>
                      {entry.symbol}
                    </span>
                    <span className="currency-select__option-name">
                      <HighlightedText text={entry.displayName} query={query} />
                    </span>
                    <span className="currency-select__check" aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="14" height="14">
                        <path
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.5 8.5 6.5 11.5 12.5 4.5"
                        />
                      </svg>
                    </span>
                  </li>
                )
              })}
            </>
          )}
        </ul>
      )}
    </div>
  )
}

export default CurrencySelect
