import { ReactNode, useEffect, useRef } from 'react'
import { Icon } from './Icon'
import { Button } from './Button'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  footer?: ReactNode
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

export const Modal = ({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
      const autofocusEl = modalRef.current?.querySelector<HTMLElement>('[data-autofocus]')
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]'
      )
      if (autofocusEl) {
        autofocusEl.focus()
      } else if (firstFocusable) {
        firstFocusable.focus()
      } else {
        modalRef.current?.focus()
      }
    } else {
      document.body.style.overflow = ''
      previousActiveElement.current?.focus()
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open || !closeOnEscape) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, closeOnEscape, onClose])

  if (!open) return null

  const sizeClasses = {
    sm: 'modal--sm',
    md: '',
    lg: 'modal--lg',
    xl: 'modal--xl',
    full: 'modal--full',
  }

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onMouseDown={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
          onClose()
        }
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`modal ${sizeClasses[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="modal-title" className="modal__title">{title}</h2>
          {showCloseButton && (
            <button
              type="button"
              className="modal__close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  )
}

export interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  busy?: boolean
}

export const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  busy = false,
}: ConfirmModalProps) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <div className="modal__footer-actions">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    }
  >
    <p className="modal__message">{message}</p>
  </Modal>
)

export default Modal