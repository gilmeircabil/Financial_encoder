import SettingsPage from './SettingsPage'
import SettingsSection from '../../components/ui/SettingsSection'
import { AppLogo } from '../../components/ui/AppLogo'
import { useSettings } from '../../contexts/SettingsContext'
import { useSettingSave } from '../../hooks/useSettingSave'
import FieldStatus from '../../components/ui/FieldStatus'

function SettingsAppearance(): React.JSX.Element | null {
  const { settings, loading } = useSettings()
  const { saving, savedKey, notice, save, dismissNotice } = useSettingSave()

  const handleLaunchIntro = (): void => {
    localStorage.removeItem('fe_intro_dismissed')
    window.location.reload()
  }

  if (loading || !settings) return null

  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <SettingsPage description="System aesthetic and visual configuration.">
      {notice ? (
        <div role="status" className="notice notice--error">
          <span>{notice.text}</span>
          <button type="button" className="notice__close" onClick={dismissNotice} aria-label="Dismiss">
            ×
          </button>
        </div>
      ) : null}

      <div className="settings-grid">
        <SettingsSection id="s-appearance" icon="palette" title="System Aesthetic" description="Corporate fintech API & cleanroom design system.">
          <div className="field">
            <span className="field__label">Theme</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
              <AppLogo size={36} withBackground />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <select
                    className="select-input"
                    value={settings.theme}
                    onChange={(e) => {
                      if (e.target.value !== settings.theme) {
                        void save('theme', e.target.value)
                      }
                    }}
                    disabled={saving === 'theme'}
                    style={{ fontWeight: 600, padding: '6px 12px' }}
                  >
                    <option value="light">The Institutional Cleanroom (Light)</option>
                    <option value="dark">Deep Space Finance (Dark)</option>
                    <option value="system">System Default</option>
                  </select>
                  <FieldStatus active={saving === 'theme'} saved={savedKey === 'theme'} />
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  {isDark
                    ? 'Deep Space canvas (#090A0B), Platinum typography (#F1F2F4), and Onyx framing (#232529) for distraction-free financial management.'
                    : 'Clean Frost canvas (#FAFAFC), Carbon Black typography (#111217), and Steel framing (#D1D5DB) for distraction-free financial management.'}
                </p>
              </div>
            </div>
          </div>

          <div className="field" style={{ marginTop: '20px' }}>
            <span className="field__label">Welcome Experience</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '8px', background: 'var(--bg-surface-alt)', border: '1px solid var(--border)' }}>
              <div>
                <p style={{ fontWeight: 600, margin: '0 0 2px', fontSize: '14px' }}>System Intro</p>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Replay the opening introduction screen.
                </p>
              </div>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={handleLaunchIntro}
              >
                Replay Intro
              </button>
            </div>
          </div>
        </SettingsSection>
      </div>
    </SettingsPage>
  )
}

export default SettingsAppearance