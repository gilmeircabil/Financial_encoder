import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import TypeToConfirmModal from '../../../src/components/ui/TypeToConfirmModal'

afterEach(() => {
  cleanup()
})

describe('TypeToConfirmModal', () => {
  it('does not render anything when open is false', () => {
    render(
      <TypeToConfirmModal
        open={false}
        title="Reset All Data"
        message="Permanently delete all records."
        confirmLabel="Reset All Data"
        requiredText="RESET ALL DATA"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.queryByText(/Reset All Data/)).not.toBeInTheDocument()
  })

  it('renders modal title, message, and phrase prompt when open', () => {
    render(
      <TypeToConfirmModal
        open={true}
        title="Reset All Data"
        message="Permanently delete all records."
        confirmLabel="Reset All Data"
        requiredText="RESET ALL DATA"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: /Reset All Data/ })).toBeInTheDocument()
    expect(screen.getByText('Permanently delete all records.')).toBeInTheDocument()
    expect(screen.getByText('RESET ALL DATA')).toBeInTheDocument()
  })

  it('disables confirm button until matching text is typed', () => {
    const onConfirm = vi.fn()
    render(
      <TypeToConfirmModal
        open={true}
        title="Reset All Data"
        message="Permanently delete all records."
        confirmLabel="Reset All Data"
        requiredText="RESET ALL DATA"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )

    const confirmBtn = screen.getByRole('button', { name: 'Reset All Data' })
    const input = screen.getByLabelText(/Type RESET ALL DATA to confirm/i)

    expect(confirmBtn).toBeDisabled()

    // Typing partial text
    fireEvent.change(input, { target: { value: 'RESET' } })
    expect(confirmBtn).toBeDisabled()

    // Typing full text in lowercase (case-insensitive supported)
    fireEvent.change(input, { target: { value: 'reset all data' } })
    expect(confirmBtn).not.toBeDisabled()

    fireEvent.click(confirmBtn)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('allows Enter key to trigger onConfirm when text matches', () => {
    const onConfirm = vi.fn()
    render(
      <TypeToConfirmModal
        open={true}
        title="Reset All Data"
        message="Permanently delete all records."
        confirmLabel="Reset All Data"
        requiredText="RESET ALL DATA"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )

    const input = screen.getByLabelText(/Type RESET ALL DATA to confirm/i)
    fireEvent.change(input, { target: { value: 'RESET ALL DATA' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(
      <TypeToConfirmModal
        open={true}
        title="Reset All Data"
        message="Permanently delete all records."
        confirmLabel="Reset All Data"
        requiredText="RESET ALL DATA"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    )

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelBtn)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('displays error message when error prop is provided', () => {
    render(
      <TypeToConfirmModal
        open={true}
        title="Reset All Data"
        message="Permanently delete all records."
        confirmLabel="Reset All Data"
        requiredText="RESET ALL DATA"
        error="Database reset failed due to a lock."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Database reset failed due to a lock.')
  })

  it('shows busyLabel and disables buttons when busy is true', () => {
    render(
      <TypeToConfirmModal
        open={true}
        title="Reset All Data"
        message="Permanently delete all records."
        confirmLabel="Reset All Data"
        requiredText="RESET ALL DATA"
        busy={true}
        busyLabel="Resetting…"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Resetting…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
