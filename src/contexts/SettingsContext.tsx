import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppSettings } from '../../electron/types/ipc'
import { api, ApiError } from '../services/api'
import { logToMain } from '../services/logger'

interface SettingsContextValue {
  settings: AppSettings | null
  loading: boolean
  error: string | null
  setSetting(key: keyof AppSettings, value: string): Promise<void>
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  loading: true,
  error: null,
  setSetting: async () => undefined,
})

function applyTheme(): void {
  document.documentElement.dataset.theme = 'bw'
}

export function SettingsProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    applyTheme()
    api.settings
      .getAll()
      .then((loaded) => {
        if (cancelled) {
          return
        }
        setSettings(loaded)
      })
      .catch((err) => {
        if (cancelled) {
          return
        }
        const message = err instanceof ApiError ? err.message : 'Settings could not be loaded.'
        setError(message)
        logToMain('error', 'settings load failed', { message })
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setSetting = useCallback(async (key: keyof AppSettings, value: string): Promise<void> => {
    const updated = await api.settings.set(key, value)
    setSettings(updated)
  }, [])

  const value = useMemo(
    () => ({ settings, loading, error, setSetting }),
    [settings, loading, error, setSetting],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext)
}