import SettingsPage from './SettingsPage'
import SettingsSection from '../../components/ui/SettingsSection'
import { AppLogo } from '../../components/ui/AppLogo'

function SettingsAbout(): React.JSX.Element {
  return (
    <SettingsPage description="Application identity, privacy policy, and legal disclaimers.">
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

        <SettingsSection
          id="s-privacy"
          icon="shield"
          title="Privacy & Security"
          description="Local vault isolation and zero-telemetry guarantee."
        >
          <div className="settings-notice-card">
            <h4 className="settings-notice-card__title">100% Offline Vault Guarantee</h4>
            <p className="settings-notice-card__body">
              Acorn operates completely offline. No financial figures, documents, transaction logs,
              or metadata are ever collected, transmitted, or tracked to external servers or cloud services.
              Your financial database and backups reside exclusively on your local workstation.
            </p>
          </div>
        </SettingsSection>

        <SettingsSection
          id="s-disclaimer"
          icon="info"
          title="Financial Disclaimer"
          description="Statutory software informational notice."
        >
          <div className="settings-notice-card">
            <h4 className="settings-notice-card__title">Notice &amp; Disclaimer</h4>
            <p className="settings-notice-card__body">
              Acorn is an offline bookkeeping and financial management tool designed for personal and
              operational productivity. Acorn does not provide certified accounting, investment, legal,
              or tax advice. All calculations and reports are generated automatically from user-entered
              data. Users are solely responsible for verifying the accuracy of all records for regulatory
              or official compliance.
            </p>
          </div>
        </SettingsSection>
      </div>
    </SettingsPage>
  )
}

export default SettingsAbout
