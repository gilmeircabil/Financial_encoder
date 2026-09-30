import { useState } from 'react'
import SettingsPage from './SettingsPage'
import SettingsSection from '../../components/ui/SettingsSection'
import CurrencySelect from '../../components/ui/CurrencySelect'
import FieldStatus from '../../components/ui/FieldStatus'
import { useSettings } from '../../contexts/SettingsContext'
import { currencySymbol, formatCurrency } from '../../utils/currency'
import { todayFormatted } from '../../utils/dates'
import { useSettingSave } from '../../hooks/useSettingSave'

function SettingsGeneral(): React.JSX.Element | null {
  const { settings } = useSettings()
  const { saving, savedKey, notice, save, dismissNotice } = useSettingSave()
  const [dateFormat, setDateFormat] = useState('')
  const [appName, setAppName] = useState(() => settings?.appName || '')

  if (!settings) {
    return null
  }

  return (
    <SettingsPage description="System name, currency, and date format preferences.">
      {notice ? (
        <div role="status" className="notice notice--error">
          <span>{notice.text}</span>
          <button type="button" className="notice__close" onClick={dismissNotice} aria-label="Dismiss">
            ×
          </button>
        </div>
      ) : null}

      <div className="settings-grid">
        <SettingsSection id="s-general" icon="globe" title="General" description="System identity, currency, and date format.">
          <div className="field">
            <label className="field__label" htmlFor="setting-app-name">System Name</label>
            <div className="field__input-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                id="setting-app-name"
                type="text"
                className="text-input"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Enter system name…"
                maxLength={60}
                disabled={saving === 'appName'}
              />
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => {
                  const trimmed = appName.trim()
                  if (trimmed && trimmed !== settings.appName) {
                    void save('appName', trimmed)
                  }
                }}
                disabled={saving === 'appName' || !appName.trim() || appName.trim() === settings.appName}
              >
                Change Name
              </button>
              <FieldStatus active={saving === 'appName'} saved={savedKey === 'appName'} />
            </div>
            <span className="field__hint">
              Changes the display name shown in the top navigation, sidebar, and reports.
            </span>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="setting-currency">Currency</label>
            <div className="field__input-row">
              <CurrencySelect
                value={settings.currency}
                onChange={(code) => {
                  if (code.toUpperCase() !== settings.currency) {
                    void save('currency', code)
                  }
                }}
              />
              <FieldStatus active={saving === 'currency'} saved={savedKey === 'currency'} />
            </div>
            <span className="field__hint">
              Symbol: <span className="field__hint-value">{currencySymbol(settings.currency)}</span>
              <span className="field__hint-sample">{formatCurrency(1234567.89, settings.currency)}</span>
            </span>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="setting-date-format">Date format</label>
            <div className="field__input-row">
              <select
                id="setting-date-format"
                className="select-input"
                value={dateFormat || settings.dateFormat}
                onChange={(e) => {
                  const value = e.target.value
                  setDateFormat(value)
                  if (value !== settings.dateFormat) {
                    void save('dateFormat', value)
                  }
                }}
                disabled={saving === 'dateFormat'}
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              </select>
              <FieldStatus active={saving === 'dateFormat'} saved={savedKey === 'dateFormat'} />
            </div>
            <span className="field__hint">
              Today: <span className="field__hint-value">{todayFormatted(dateFormat || settings.dateFormat)}</span>
            </span>
          </div>
        </SettingsSection>
      </div>
    </SettingsPage>
  )
}

export default SettingsGeneral