import { useState } from 'react'
import { AppLogo } from './AppLogo'
import { useSettings } from '../../contexts/SettingsContext'

interface IntroScreenProps {
  onEnter: () => void
}

export function IntroScreen({ onEnter }: IntroScreenProps): React.JSX.Element {
  const { settings, setSetting } = useSettings()
  const initialName = settings?.appName || 'Financial Encoder'
  const [name, setName] = useState(initialName)
  const [skipStartup, setSkipStartup] = useState(() => {
    return localStorage.getItem('fe_intro_dismissed') === 'true'
  })

  const handleEnter = async (): Promise<void> => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== settings?.appName) {
      try {
        await setSetting('appName', trimmed)
      } catch {
        // Continue even if setting save encounters issue
      }
    }
    if (skipStartup) {
      localStorage.setItem('fe_intro_dismissed', 'true')
    } else {
      localStorage.removeItem('fe_intro_dismissed')
    }
    onEnter()
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      void handleEnter()
    }
  }

  return (
    <div className="intro-screen" onKeyDown={handleKeyDown}>
      <div className="intro-card">
        <div className="intro-emblem">
          <AppLogo size={72} withBackground />
        </div>

        <h1 className="intro-title">{name || 'Financial Encoder'}</h1>
        <p className="intro-subtitle">
          Minimalist offline financial management &amp; encoding suite.
        </p>

        <div className="intro-badges">
          <span className="intro-badge">Offline &amp; Encrypted</span>
          <span className="intro-badge">Monochrome Edition</span>
          <span className="intro-badge">Zero Telemetry</span>
        </div>

        <div className="intro-form">
          <label className="intro-form__label" htmlFor="intro-system-name">
            System Name
          </label>
          <div className="intro-form__row">
            <input
              id="intro-system-name"
              type="text"
              className="intro-form__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name your system…"
              maxLength={60}
              autoFocus
            />
          </div>
        </div>

        <div className="intro-actions">
          <button
            type="button"
            className="intro-enter-btn"
            onClick={() => void handleEnter()}
          >
            <span>Enter System</span>
            <span aria-hidden="true">&rarr;</span>
          </button>

          <label className="intro-toggle">
            <input
              type="checkbox"
              checked={skipStartup}
              onChange={(e) => setSkipStartup(e.target.checked)}
            />
            <span>Skip intro on next startup</span>
          </label>
        </div>
      </div>
    </div>
  )
}

export default IntroScreen
