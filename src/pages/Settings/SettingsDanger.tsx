import { useState } from 'react'
import SettingsSection from '../../components/ui/SettingsSection'
import TypeToConfirmModal from '../../components/ui/TypeToConfirmModal'
import { logToMain } from '../../services/logger'
import { api, ApiError } from '../../services/api'

function SettingsDanger(): React.JSX.Element {
  const [openConfirm, setOpenConfirm] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [resetNotice, setResetNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)

  async function handleConfirmReset(): Promise<void> {
    setResetBusy(true)
    setModalError(null)
    setResetNotice(null)
    try {
      await api.db.reset()
      setOpenConfirm(false)
      window.location.reload()
    } catch (err) {
      const message = (err as ApiError).message ?? 'The data could not be reset.'
      setModalError(message)
      setResetNotice({ kind: 'error', text: message })
      logToMain('error', 'data reset failed', { message })
    } finally {
      setResetBusy(false)
    }
  }

  const handleOpenModal = (): void => {
    setModalError(null)
    setOpenConfirm(true)
  }

  return (
    <>
      <SettingsSection
        id="s-danger"
        icon="shield"
        title="Danger zone"
        description="Permanently erase all data. This action cannot be undone."
        tone="danger"
      >
        {resetNotice ? (
          <div role="status" className={`notice notice--${resetNotice.kind}`}>
            {resetNotice.text}
          </div>
        ) : null}
        <button
          type="button"
          className="btn btn--danger"
          onClick={handleOpenModal}
          disabled={resetBusy}
        >
          {resetBusy ? 'Resetting\u2026' : 'Reset all data\u2026'}
        </button>
      </SettingsSection>

      <TypeToConfirmModal
        open={openConfirm}
        title="Reset All Data"
        message="All financial data will be permanently deleted."
        confirmLabel="Reset All Data"
        requiredText="RESET ALL DATA"
        busy={resetBusy}
        busyLabel="Resetting\u2026"
        error={modalError}
        onConfirm={handleConfirmReset}
        onCancel={() => {
          if (!resetBusy) {
            setOpenConfirm(false)
            setModalError(null)
          }
        }}
      />
    </>
  )
}

export default SettingsDanger
