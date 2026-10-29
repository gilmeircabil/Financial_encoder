import PageHeader from '../../components/ui/PageHeader'
import { useSettings } from '../../contexts/SettingsContext'
import SettingsGeneral from './SettingsGeneral'
import SettingsAppearance from './SettingsAppearance'
import SettingsBackups from './SettingsBackups'
import SettingsAbout from './SettingsAbout'
import SettingsDanger from './SettingsDanger'

function SettingsPage(): React.JSX.Element {
  const { loading, error, settings } = useSettings()

  if (loading) {
    return (
      <div className="page settings-page">
        <PageHeader title="Settings" />
        <div className="card"><div className="spinner" aria-label="Loading settings" /></div>
      </div>
    )
  }

  if (error || !settings) {
    return (
      <div className="page settings-page">
        <PageHeader title="Settings" />
        <div className="card card--error">Settings could not be loaded: {error}</div>
      </div>
    )
  }

  return (
    <div className="page settings-page">
      <PageHeader title="Settings" />
      <div className="settings-grid">
        <SettingsGeneral />
        <SettingsAppearance />
        <SettingsBackups />
        <SettingsAbout />
        <SettingsDanger />
      </div>
    </div>
  )
}

export default SettingsPage
