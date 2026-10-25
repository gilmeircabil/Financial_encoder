import { Component, lazy, Suspense, useEffect, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SettingsProvider } from './contexts/SettingsContext'
import { ToastProvider } from './contexts/ToastContext'
import { DateRangeProvider } from './contexts/DateRangeContext'
import { api, ApiError } from './services/api'
import { installGlobalErrorForwarding, logToMain } from './services/logger'
import AppShell from './components/layout/AppShell'
import { DEFAULT_SETTINGS_PATH } from './pages/Settings/settingsSections'
import Dashboard from './pages/Dashboard/Dashboard'
import IntroScreen from './components/ui/IntroScreen'
import { AppLogo } from './components/ui/AppLogo'

const Transactions = lazy(() => import('./pages/Transactions/Transactions'))
const Income = lazy(() => import('./pages/Income/Income'))
const Expenses = lazy(() => import('./pages/Expenses/Expenses'))
const Capital = lazy(() => import('./pages/Capital/Capital'))
const CashFlow = lazy(() => import('./pages/CashFlow/CashFlow'))
const Reports = lazy(() => import('./pages/Reports/Reports'))
const Import = lazy(() => import('./pages/Import/Import'))
const Documents = lazy(() => import('./pages/Documents/Documents'))
const SettingsGeneral = lazy(() => import('./pages/Settings/SettingsGeneral'))
const SettingsAppearance = lazy(() => import('./pages/Settings/SettingsAppearance'))
const SettingsBackups = lazy(() => import('./pages/Settings/SettingsBackups'))
const SettingsAbout = lazy(() => import('./pages/Settings/SettingsAbout'))
const SettingsDanger = lazy(() => import('./pages/Settings/SettingsDanger'))

interface ErrorBoundaryState {
  error: Error | null
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logToMain('error', 'renderer component error', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    })
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="boot">
          <div className="boot__card boot__card--error" role="alert">
            <p className="boot__title">Something went wrong in the interface</p>
            <p className="boot__detail">{this.state.error.message}</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                this.setState({ error: null })
                window.location.hash = '#/dashboard'
                window.location.reload()
              }}
            >
              Reload Interface
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

type BootstrapState =
  | { status: 'loading' }
  | { status: 'ok' }
  | { status: 'error'; message: string }

function BootstrapGate({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, setState] = useState<BootstrapState>({ status: 'loading' })

  useEffect(() => {
    installGlobalErrorForwarding()
    let cancelled = false

    async function bootstrap(): Promise<void> {
      try {
        await api.app.getInfo()
        await api.app.ping()
        await api.db.init()
        if (!cancelled) {
          setState({ status: 'ok' })
          logToMain('info', 'bootstrap complete')
        }
      } catch (err) {
        if (cancelled) {
          return
        }
        const message = err instanceof ApiError ? err.message : 'The application interface could not start.'
        setState({ status: 'error', message })
        logToMain('error', 'renderer bootstrap failed', { message })
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <div className="boot">
        <div className="boot__card">
          <AppLogo size={48} withBackground />
          <div className="spinner" aria-label="Loading" />
          <p className="boot__text">Starting system&hellip;</p>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="boot">
        <div className="boot__card boot__card--error" role="alert">
          <p className="boot__title">The application could not start</p>
          <p className="boot__detail">{state.message}</p>
          <p className="boot__hint">
            A technical record has been written to the application log file.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function SystemContent(): React.JSX.Element {
  const [showIntro, setShowIntro] = useState(() => {
    return localStorage.getItem('fe_intro_dismissed') !== 'true'
  })

  if (showIntro) {
    return <IntroScreen onEnter={() => setShowIntro(false)} />
  }

  return (
    <Suspense fallback={<div className="spinner" style={{ margin: '40px auto' }} aria-label="Loading page" />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/income" element={<Income />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/capital" element={<Capital />} />
          <Route path="/cash-flow" element={<CashFlow />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/import" element={<Import />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/settings" element={<Navigate to={DEFAULT_SETTINGS_PATH} replace />} />
          <Route path="/settings/general" element={<SettingsGeneral />} />
          <Route path="/settings/appearance" element={<SettingsAppearance />} />
          <Route path="/settings/backups" element={<SettingsBackups />} />
          <Route path="/settings/about" element={<SettingsAbout />} />
          <Route path="/settings/danger" element={<SettingsDanger />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

function App(): React.JSX.Element {
  return (
    <AppErrorBoundary>
      <SettingsProvider>
        <ToastProvider>
          <DateRangeProvider>
            <HashRouter>
              <BootstrapGate>
                <SystemContent />
              </BootstrapGate>
            </HashRouter>
          </DateRangeProvider>
        </ToastProvider>
      </SettingsProvider>
    </AppErrorBoundary>
  )
}

export default App