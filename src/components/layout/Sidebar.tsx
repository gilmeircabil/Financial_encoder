import { NavLink } from 'react-router-dom'
import { NAV_SECTIONS } from '../../navigation'
import { Icon } from '../ui/Icon'
import { AppLogo } from '../ui/AppLogo'
import { useSettings } from '../../contexts/SettingsContext'

interface SidebarProps {
  onQuickAddIncome?: () => void
  onQuickAddExpense?: () => void
}

function Sidebar({ onQuickAddIncome, onQuickAddExpense }: SidebarProps): React.JSX.Element {
  const { settings } = useSettings()
  const appName = settings?.appName || 'Acorn'

  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden="true">
          <AppLogo size={32} />
        </div>
        <div className="sidebar__brand-text">
          <span className="sidebar__name">{appName}</span>
          <span className="sidebar__version-tag">LOCAL VAULT</span>
        </div>
      </div>

      {(onQuickAddIncome || onQuickAddExpense) ? (
        <div className="sidebar__quick-pills">
          {onQuickAddIncome ? (
            <button
              type="button"
              className="sidebar__quick-pill"
              onClick={onQuickAddIncome}
            >
              <Icon name="plus" size={14} />
              <span>Add income</span>
            </button>
          ) : null}
          {onQuickAddExpense ? (
            <button
              type="button"
              className="sidebar__quick-pill"
              onClick={onQuickAddExpense}
            >
              <Icon name="plus" size={14} />
              <span>Add expense</span>
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="sidebar__sections">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="sidebar__group">
            <span className="sidebar__group-title">{section.title}</span>
            <ul className="sidebar__list">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                    }
                  >
                    <Icon name={item.icon} size={17} />
                    <span className="sidebar__link-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="sidebar__footer">
        <div className="sidebar__status">
          <span className="sidebar__status-dot" aria-hidden="true" />
          <span className="sidebar__foot-label">Offline &amp; Local</span>
        </div>
        <span className="sidebar__credit">Acorn Suite</span>
      </div>
    </nav>
  )
}

export default Sidebar