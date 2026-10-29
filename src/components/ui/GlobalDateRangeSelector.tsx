import { useDateRange, PERIOD_KEYS, PERIOD_LABELS } from '../../contexts/DateRangeContext'
import type { PeriodKey } from '../../utils/periods'

interface GlobalDateRangeSelectorProps {
  className?: string
  variant?: 'pills' | 'dropdown'
}

export function GlobalDateRangeSelector({ className = '', variant = 'pills' }: GlobalDateRangeSelectorProps): React.JSX.Element {
  const { period, customFrom, customTo, periodLabel, customInvalid, setPeriod, setCustomFrom, setCustomTo } =
    useDateRange()

  if (variant === 'dropdown') {
    return (
      <div className={`date-range-dropdown-wrap ${className}`}>
        <select
          className="select-input select-input--sm range-dropdown-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodKey)}
          aria-label="Filter date range"
        >
          {PERIOD_KEYS.map((key) => (
            <option key={key} value={key}>
              {PERIOD_LABELS[key]}
            </option>
          ))}
          <option value="custom">Custom Range</option>
        </select>

        {period === 'custom' && (
          <div className="period-custom period-custom--inline">
            <input
              type="date"
              className="text-input text-input--sm"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              aria-label="From date"
            />
            <span className="period-custom__sep">–</span>
            <input
              type="date"
              className="text-input text-input--sm"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              aria-label="To date"
            />
          </div>
        )}

        {customInvalid && (
          <div
            role="alert"
            className="notice notice--error notice--compact"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              zIndex: 30,
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            From date must be on or before To date.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`date-range-toolbar ${className}`}>
      <div className="period-selector period-selector--pills" role="radiogroup" aria-label="Global time period">
        {PERIOD_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`dash-period-pill${period === key ? ' dash-period-pill--active' : ''}`}
            role="radio"
            aria-checked={period === key}
            onClick={() => setPeriod(key)}
          >
            {PERIOD_LABELS[key]}
          </button>
        ))}
        <button
          type="button"
          className={`dash-period-pill${period === 'custom' ? ' dash-period-pill--active' : ''}`}
          role="radio"
          aria-checked={period === 'custom'}
          onClick={() => setPeriod('custom')}
        >
          Custom
        </button>
      </div>

      {period === 'custom' && (
        <div className="period-custom">
          <label className="field__label" htmlFor="global-range-from">From</label>
          <input
            id="global-range-from"
            type="date"
            className="text-input text-input--sm"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
          />
          <label className="field__label" htmlFor="global-range-to">To</label>
          <input
            id="global-range-to"
            type="date"
            className="text-input text-input--sm"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
          />
        </div>
      )}

      {period === 'custom' && periodLabel && (
        <span className="date-range-plain-text" aria-live="polite">
          {periodLabel}
        </span>
      )}

      {customInvalid ? (
        <div role="alert" className="notice notice--error" style={{ width: '100%', marginTop: '8px' }}>
          The &quot;From&quot; date must be on or before the &quot;To&quot; date.
        </div>
      ) : null}
    </div>
  )
}
