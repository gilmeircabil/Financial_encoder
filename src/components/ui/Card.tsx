import { HTMLAttributes, forwardRef } from 'react'

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', hoverable = false, className = '', children, ...props }, ref) => {
    const variantClasses = {
      default: 'card',
      elevated: 'card card--elevated',
      outlined: 'card card--outlined',
      filled: 'card card--filled',
    }

    const paddingClasses = {
      none: '',
      sm: 'card--p-sm',
      md: '',
      lg: 'card--p-lg',
    }

    const classes = [
      variantClasses[variant],
      paddingClasses[padding],
      hoverable ? 'card--hoverable' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`card__header ${className}`} {...props}>
        <div className="card__header-content">
          <h3 className="card__title">{title}</h3>
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>
        {action && <div className="card__header-action">{action}</div>}
        {children}
      </div>
    )
  },
)

CardHeader.displayName = 'CardHeader'

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`card__body ${className}`} {...props}>
        {children}
      </div>
    )
  },
)

CardBody.displayName = 'CardBody'

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`card__footer ${className}`} {...props}>
        {children}
      </div>
    )
  },
)

CardFooter.displayName = 'CardFooter'

export default Card