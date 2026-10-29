import { ReactNode } from 'react'

export interface PageHeaderProps {
  /** Required page title */
  title: string
  /** Optional descriptive text */
  description?: string
  /** Optional action elements (buttons, links) on the right */
  actions?: ReactNode
}

function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps): React.JSX.Element {
  return (
    <header className="page-header">
      <div className="page-header__content">
        <h1 className="page-header__title">{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}

export default PageHeader