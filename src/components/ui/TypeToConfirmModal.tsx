import { useEffect, useState, type ReactNode } from 'react'
import Modal from './Modal'

interface TypeToConfirmModalProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  requiredText: string
  busy?: boolean
  busyLabel?: string
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

function TypeToConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  requiredText,
  busy = false,
  busyLabel,
  error,
  onConfirm,
  onCancel,
}: TypeToConfirmModalProps): React.JSX.Element {
  const [typed, setTyped] = useState('')
  const normalizedTyped = typed.trim().toUpperCase()
  const normalizedRequired = requiredText.trim().toUpperCase()
  const matches = normalizedTyped === normalizedRequired

  useEffect(() => {
    if (open) {
      setTyped('')
    }
  }, [open])

  const close = (): void => {
    if (!busy) {
      onCancel()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && matches && !busy) {
      e.preventDefault()
      onConfirm()
    }
  }

  return (
    <Modal
      open={open}
      title={`⚠️ ${title}`}
      onClose={close}
      footer={
        <div className="modal__footer-actions">
          <button type="button" className="btn btn--secondary" onClick={close} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy || !matches}>
            {busy && busyLabel ? busyLabel : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="confirm-dialog">
        <p className="confirm-dialog__lead">This action cannot be undone.</p>
        <div className="confirm-dialog__detail">{message}</div>
        {error && (
          <div role="alert" className="notice notice--error" style={{ marginBottom: 14 }}>
            {error}
          </div>
        )}
        <div className="confirm-dialog__type">
          <label htmlFor="confirm-phrase-input" className="confirm-dialog__label">
            To confirm, type:
          </label>
          <code className="confirm-dialog__phrase">{requiredText}</code>
          <input
            id="confirm-phrase-input"
            type="text"
            className={`text-input confirm-dialog__input${matches ? ' is-match' : ''}`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={requiredText.length + 10}
            disabled={busy}
            data-autofocus
            placeholder={requiredText}
            aria-label={`Type ${requiredText} to confirm`}
          />
        </div>
      </div>
    </Modal>
  )
}

export default TypeToConfirmModal