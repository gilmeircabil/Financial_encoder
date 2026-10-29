import { InputHTMLAttributes, forwardRef, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  size?: InputSize
  fullWidth?: boolean
  icon?: IconName
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, size = 'md', fullWidth = true, className = '', id, icon, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const sizeClasses = {
      sm: 'input--sm',
      md: '',
      lg: 'input--lg',
    }

    const classes = [
      'input',
      sizeClasses[size],
      fullWidth ? 'input--full' : '',
      error ? 'input--error' : '',
      icon ? 'input--with-icon' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="input-wrapper">
        {label && <label htmlFor={inputId} className="input__label">{label}</label>}
        <div className={icon ? 'input__icon-wrapper' : ''}>
          {icon && <span className="input__icon" aria-hidden="true"><Icon name={icon} size={16} /></span>}
          <input ref={ref} id={inputId} className={classes} aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined} {...props} />
        </div>
        {error && <p id={`${inputId}-error`} className="input__error" role="alert">{error}</p>}
        {hint && !error && <p id={`${inputId}-hint`} className="input__hint">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  size?: InputSize
  fullWidth?: boolean
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, size = 'md', fullWidth = true, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const sizeClasses = {
      sm: 'input--sm',
      md: '',
      lg: 'input--lg',
    }

    const classes = [
      'input select-input',
      sizeClasses[size],
      fullWidth ? 'input--full' : '',
      error ? 'input--error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="input-wrapper">
        {label && <label htmlFor={selectId} className="input__label">{label}</label>}
        <select ref={ref} id={selectId} className={classes} aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined} {...props}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p id={`${selectId}-error`} className="input__error" role="alert">{error}</p>}
        {hint && !error && <p id={`${selectId}-hint`} className="input__hint">{hint}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  size?: InputSize
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, size = 'md', fullWidth = true, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const sizeClasses = {
      sm: 'input--sm',
      md: '',
      lg: 'input--lg',
    }

    const classes = [
      'input textarea-input',
      sizeClasses[size],
      fullWidth ? 'input--full' : '',
      error ? 'input--error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="input-wrapper">
        {label && <label htmlFor={textareaId} className="input__label">{label}</label>}
        <textarea ref={ref} id={textareaId} className={classes} aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined} {...props} />
        {error && <p id={`${textareaId}-error`} className="input__error" role="alert">{error}</p>}
        {hint && !error && <p id={`${textareaId}-hint`} className="input__hint">{hint}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'

export default Input