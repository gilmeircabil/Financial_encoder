import React from 'react'
import { Icon } from '../ui/Icon'

interface AssistantFABProps {
  isOpen: boolean
  onToggle: () => void
}

export function AssistantFAB({ isOpen, onToggle }: AssistantFABProps): React.JSX.Element {
  return (
    <aside aria-label="Acorn Assistant launcher">
      <button
        type="button"
        className={`assistant-fab ${isOpen ? 'assistant-fab--active' : ''}`}
        onClick={onToggle}
        aria-label={isOpen ? 'Close Assistant' : 'Open Assistant (Ctrl+J)'}
        title={isOpen ? 'Close Assistant (Esc)' : 'Open Assistant (Ctrl+J)'}
      >
        <span className="assistant-fab__icon" aria-hidden="true">
          <Icon name={isOpen ? 'x' : 'sparkles'} size={17} />
        </span>
        <span className="assistant-fab__label">
          {isOpen ? 'Close Assistant' : 'Ask Assistant'}
        </span>
        <kbd className="assistant-fab__kbd" aria-hidden="true">
          Ctrl+J
        </kbd>
        <span className="assistant-fab__pulse" aria-hidden="true" />
      </button>
    </aside>
  )
}

export default AssistantFAB
