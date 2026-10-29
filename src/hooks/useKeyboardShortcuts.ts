import { useEffect, useCallback } from 'react'

interface UseKeyboardShortcutsOptions {
  onNewTransaction?: () => void
  onSearch?: () => void
  onExport?: () => void
  onAssistant?: () => void
}

export function useKeyboardShortcuts({
  onNewTransaction,
  onSearch,
  onExport,
  onAssistant,
}: UseKeyboardShortcutsOptions = {}): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      const isCtrlOrMeta = event.ctrlKey || event.metaKey

      // Ctrl/Cmd + N: New transaction
      if (isCtrlOrMeta && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        onNewTransaction?.()
        return
      }

      // Ctrl/Cmd + J: Local AI Assistant
      if (isCtrlOrMeta && event.key.toLowerCase() === 'j') {
        event.preventDefault()
        onAssistant?.()
        return
      }

      // Ctrl/Cmd + K or /: Focus search
      if (isCtrlOrMeta && (event.key === 'k' || event.key === '/')) {
        event.preventDefault()
        onSearch?.()
        return
      }

      // Ctrl/Cmd + E: Export
      if (isCtrlOrMeta && event.key.toLowerCase() === 'e') {
        event.preventDefault()
        onExport?.()
        return
      }
    },
    [onNewTransaction, onAssistant, onSearch, onExport],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export default useKeyboardShortcuts