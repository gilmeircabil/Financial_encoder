import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Icon, type IconName } from './Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref,
  ) => {
    const variantClasses = {
      primary: 'btn--primary',
      secondary: 'btn--secondary',
      outline: 'btn--outline',
      ghost: 'btn--ghost',
      danger: 'btn--danger',
    }

    const sizeClasses = {
      sm: 'btn--sm',
      md: '',
      lg: 'btn--lg',
    }

    const isIconOnly = !children && Boolean(icon)

    const classes = [
      'btn',
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'btn--full' : '',
      loading ? 'btn--loading' : '',
      isIconOnly ? 'btn--icon-only' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="btn__spinner" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 12 12"
                  to="360 12 12"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </span>
        )}
        {!loading && icon && iconPosition === 'left' && <Icon name={icon} size={size === 'sm' ? 13 : 15} />}
        {children ? <span className="btn__text">{children}</span> : null}
        {!loading && icon && iconPosition === 'right' && <Icon name={icon} size={size === 'sm' ? 13 : 15} />}
      </button>
    )
  },
)

Button.displayName = 'Button'

export default Button