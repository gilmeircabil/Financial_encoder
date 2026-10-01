import SettingsPage from './SettingsPage'
import SettingsSection from '../../components/ui/SettingsSection'
import { AppLogo } from '../../components/ui/AppLogo'

function SettingsAppearance(): React.JSX.Element | null {
  const handleLaunchIntro = (): void => {
    localStorage.removeItem('fe_intro_dismissed')
    window.location.reload()
  }

  return (
    <SettingsPage description="System aesthetic and visual configuration.">
      <div className="settings-grid">
        <SettingsSection id="s-appearance" icon="palette" title="System Aesthetic" description="Corporate fintech API & cleanroom design system.">
          <div className="field">
            <span className="field__label">Theme</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
              <AppLogo size={36} withBackground />
              <div>
                <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '15px' }}>The Institutional Cleanroom</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  Clean Frost canvas (#FAFAFC), Carbon Black typography (#111217), and Steel framing (#D1D5DB) for distraction-free financial management.
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