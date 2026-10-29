import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useSettings } from '../../contexts/SettingsContext'
import { api } from '../../services/api'
import { processAssistantQuery } from '../../lib/assistant/assistantEngine'
import {
  QUESTION_CATEGORIES,
  getQuestionsByCategory,
  type QuestionCategoryId,
  type QuestionDefinition,
} from '../../lib/assistant/questionRegistry'
import type { AssistantMessage } from '../../lib/assistant/types'
import type { Category } from '../../../electron/types/ipc'

interface AssistantDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const WELCOME_TEXT =
  "Hi! I'm Acorn, your financial assistant. I can help you understand your income, expenses, cash flow, and spending patterns using your financial records."

function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, lIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    return (
      <React.Fragment key={lIdx}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="assistant-msg__strong">
                {part.slice(2, -2)}
              </strong>
            )
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em key={pIdx} className="assistant-msg__em">
                {part.slice(1, -1)}
              </em>
            )
          }
          return part
        })}
        {lIdx < lines.length - 1 && <br />}
      </React.Fragment>
    )
  })
}

export function AssistantDrawer({ isOpen, onClose }: AssistantDrawerProps): React.JSX.Element | null {
  const { settings } = useSettings()
  const navigate = useNavigate()
  const currencyCode = settings?.currency || 'PHP'

  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<QuestionCategoryId>('my_money')
  const [showQuestionLibrary, setShowQuestionLibrary] = useState(true)

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: WELCOME_TEXT,
      timestamp: 'Just now',
    },
  ])

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load available categories to feed the intent parser
  useEffect(() => {
    let active = true
    api.categories
      .list()
      .then((rows) => {
        if (active && Array.isArray(rows)) {
          setCategories(rows)
        }
      })
      .catch(() => {
        // Fallback to empty if not loaded
      })
    return () => {
      active = false
    }
  }, [])

  // Auto-scroll chat to bottom
  const scrollToBottom = useCallback((): void => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [isOpen, messages, scrollToBottom])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSend = async (userPrompt: string): Promise<void> => {
    const trimmed = userPrompt.trim()
    if (!trimmed || loading) return

    const now = new Date()
    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setQuery('')
    setLoading(true)

    try {
      const response = await processAssistantQuery(trimmed, categories, currencyCode, api, now)
      setMessages((prev) => [...prev, response])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'An error occurred while calculating financial records from the database.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    void handleSend(query)
  }

  const handleClearHistory = (): void => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: WELCOME_TEXT,
        timestamp: 'Just now',
      },
    ])
    setShowQuestionLibrary(true)
  }

  const categoryQuestions = getQuestionsByCategory(activeCategory)

  if (!isOpen) return null

  return (
    <>
      <div
        className="assistant-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="assistant-window"
        role="dialog"
        aria-label="Acorn Local Financial Assistant"
        aria-modal="true"
      >
        {/* Header */}
        <div className="assistant-window__header">
          <div className="assistant-window__brand">
            <span className="assistant-window__icon">
              <Icon name="sparkles" size={17} />
            </span>
            <div>
              <div className="assistant-window__title">Local AI Financial Assistant</div>
              <div className="assistant-window__subtitle">
                <span className="assistant-window__dot" />
                <span>100% Offline · Private SQLite</span>
              </div>
            </div>
          </div>

          <div className="assistant-window__actions">
            <button
              type="button"
              className="assistant-btn-icon"
              onClick={() => setShowQuestionLibrary((prev) => !prev)}
              title={showQuestionLibrary ? 'Hide Question Library' : 'View Question Library'}
              aria-label="Toggle Question Library"
            >
              <Icon name="helpCircle" size={15} />
            </button>
            <button
              type="button"
              className="assistant-btn-icon"
              onClick={handleClearHistory}
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Icon name="trash" size={14} />
            </button>
            <button
              type="button"
              className="assistant-btn-icon"
              onClick={onClose}
              title="Close Assistant (Esc)"
              aria-label="Close Assistant"
            >
              <Icon name="x" size={15} />
            </button>
          </div>
        </div>

        {/* 5-Category Navigation Tabs */}
        {showQuestionLibrary && (
          <div className="assistant-library">
            <nav className="assistant-tabs" aria-label="Suggested question categories">
              {QUESTION_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`assistant-tab ${isActive ? 'assistant-tab--active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                    aria-selected={isActive}
                    role="tab"
                  >
                    <Icon name={cat.iconName} size={13} />
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Questions for Active Category */}
            <div className="assistant-question-grid" role="tabpanel">
              {categoryQuestions.map((q: QuestionDefinition) => (
                <button
                  key={q.id}
                  type="button"
                  className="assistant-question-card"
                  onClick={() => void handleSend(q.prompt)}
                  disabled={loading}
                >
                  <span className="assistant-question-card__icon">
                    <Icon name={q.iconName} size={13} />
                  </span>
                  <span className="assistant-question-card__text">{q.label}</span>
                  <Icon name="chevronRight" size={12} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="assistant-window__body">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user'
            return (
              <div
                key={msg.id}
                className={`assistant-msg ${isUser ? 'assistant-msg--user' : 'assistant-msg--ai'}`}
              >
                {!isUser && (
                  <div className="assistant-msg__avatar" aria-hidden="true">
                    <Icon name="sparkles" size={13} />
                  </div>
                )}
                <div className="assistant-msg__bubble">
                  <div className="assistant-msg__text">{renderFormattedText(msg.text)}</div>

                  {/* Render Structured Finance KPI Card if present */}
                  {msg.data && (
                    <div className="assistant-kpi-card">
                      {msg.data.headline && (
                        <div className="assistant-kpi-card__headline">
                          <span>{msg.data.headline}</span>
                          {msg.data.dateRangeLabel && (
                            <span className="assistant-kpi-card__daterange">
                              {msg.data.dateRangeLabel}
                            </span>
                          )}
                        </div>
                      )}

                      {msg.data.primaryValue && (
                        <div className="assistant-kpi-card__primary">
                          <div className="assistant-kpi-card__meta">
                            <span className="assistant-kpi-card__label">{msg.data.primaryLabel}</span>
                            {msg.data.badge && (
                              <span className={`assistant-kpi-badge assistant-kpi-badge--${msg.data.variant || 'neutral'}`}>
                                {msg.data.badge}
                              </span>
                            )}
                          </div>
                          <div className={`assistant-kpi-card__val assistant-kpi-card__val--${msg.data.variant || 'neutral'}`}>
                            {msg.data.primaryValue}
                          </div>
                        </div>
                      )}

                      {/* Structured Table */}
                      {msg.data.table && (
                        <div className="assistant-table-container">
                          <table className="assistant-table">
                            <thead>
                              <tr>
                                {msg.data.table.headers.map((h, hIdx) => (
                                  <th key={hIdx}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {msg.data.table.rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Key Breakdown Rows */}
                      {msg.data.breakdown && msg.data.breakdown.length > 0 && (
                        <div className="assistant-kpi-card__breakdown">
                          {msg.data.breakdown.map((row, rIdx) => (
                            <div key={rIdx} className="assistant-kpi-card__row">
                              <span className="assistant-kpi-card__row-label">{row.label}</span>
                              <span className="assistant-kpi-card__row-val">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.data.actionLink && (
                        <div className="assistant-kpi-card__footer">
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm assistant-kpi-card__btn"
                            onClick={() => {
                              navigate(msg.data!.actionLink!)
                            }}
                          >
                            <span>{msg.data.actionLabel || 'View in App'}</span>
                            <Icon name="chevronRight" size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contextual Follow-Up Suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="assistant-msg__suggestions-wrapper">
                      <div className="assistant-msg__suggestions-label">Follow-up questions:</div>
                      <div className="assistant-msg__suggestions">
                        {msg.suggestions.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            className="assistant-chip"
                            onClick={() => void handleSend(chip)}
                            disabled={loading}
                          >
                            <span>{chip}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="assistant-msg__time">{msg.timestamp}</div>
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="assistant-msg assistant-msg--ai">
              <div className="assistant-msg__avatar">
                <Icon name="sparkles" size={13} />
              </div>
              <div className="assistant-msg__bubble assistant-msg__bubble--loading">
                <span className="assistant-loading-dot" />
                <span className="assistant-loading-dot" />
                <span className="assistant-loading-dot" />
                <span className="assistant-loading-text">Calculating from local SQLite records...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Bottom Input Form */}
        <form className="assistant-window__input-box" onSubmit={handleSubmit}>
          <div className="assistant-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="assistant-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question (e.g. 'how much did I spend this month?')..."
              disabled={loading}
              aria-label="Assistant question"
            />
            <button
              type="submit"
              className="assistant-input__submit"
              disabled={!query.trim() || loading}
              aria-label="Send question"
            >
              <Icon name="arrowUpRight" size={15} />
            </button>
          </div>
          <div className="assistant-window__footnote">
            Deterministic calculations run 100% locally on SQLite. Zero data leaves your device.
          </div>
        </form>
      </div>
    </>
  )
}

export default AssistantDrawer
