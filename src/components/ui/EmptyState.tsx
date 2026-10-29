import { Icon } from './Icon'
import type { IconName } from './Icon'
import { ReactNode } from 'react'

export interface EmptyStateProps {
  /** Optional icon name from the Icon component */
  icon?: IconName
  /** Required title text */
  title: string
  /** Optional description text */
  description?: string
  /** Optional action button children */
  children?: ReactNode
}

function EmptyState({
  icon,
  title,
  description,
  children,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="empty-state" aria-label={title}>
      {icon && (
        <div className="empty-state__icon" aria-hidden="true">
          <Icon name={icon} size={28} />
        </div>
      )}
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__description">{description}</p>}
      {children ? (
        <div className="empty-state__actions">
          {children}
        </div>
      ) : null}
    </div>
  )
}

export default EmptyState