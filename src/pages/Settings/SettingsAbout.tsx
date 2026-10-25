import SettingsPage from './SettingsPage'
import SettingsSection from '../../components/ui/SettingsSection'
import { AppLogo } from '../../components/ui/AppLogo'

function SettingsAbout(): React.JSX.Element {
  return (
    <SettingsPage description="About this application.">
      <div className="settings-grid">
        <SettingsSection id="s-about" icon="info" title="About">
          <div className="settings-about">
            <AppLogo size={56} withBackground />
            <h3 className="settings-about__name">Acorn</h3>
            <p className="settings-about__label">Developer</p>
            <p className="settings-about__value">GilmierDev</p>
            <p className="settings-about__sublabel">Software &amp; AI Developer</p>
            <p className="settings-about__copyright">© 2026 GilmierDev. All Rights Reserved.</p>
          </div>
        </SettingsSection>
      </div>
    </SettingsPage>
  )
}

export default SettingsAbout