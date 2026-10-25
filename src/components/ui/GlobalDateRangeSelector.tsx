import { useDateRange, PERIOD_KEYS, PERIOD_LABELS } from '../../contexts/DateRangeContext'

interface GlobalDateRangeSelectorProps {
  className?: string
}

export function GlobalDateRangeSelector({ className = '' }: GlobalDateRangeSelectorProps): React.JSX.Element {
  const { period, customFrom, customTo, periodLabel, customInvalid, setPeriod, setCustomFrom, setCustomTo } =
    useDateRange()

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

      <span className="date-range-plain-text" aria-live="polite">
        {periodLabel}
      </span>

      {customInvalid ? (
        <div role="alert" className="notice notice--error" style={{ width: '100%', marginTop: '8px' }}>
          The &quot;From&quot; date must be on or before the &quot;To&quot; date.
        </div>
      ) : null}
    </div>
  )
}
