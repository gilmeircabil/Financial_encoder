import type { IconName } from './components/ui/Icon'

export interface NavItem {
  path: string
  label: string
  icon: IconName
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { path: '/transactions', label: 'Transactions', icon: 'transactions' },
      { path: '/cash-flow', label: 'Cash Flow', icon: 'cashflow' },
    ],
  },
  {
    title: 'Ledgers',
    items: [
      { path: '/income', label: 'Income', icon: 'income' },
      { path: '/expenses', label: 'Expenses', icon: 'expenses' },
      { path: '/capital', label: 'Capital', icon: 'capital' },
    ],
  },
  {
    title: 'Data & Tools',
    items: [
      { path: '/documents', label: 'Documents (OCR)', icon: 'documents' },
      { path: '/import', label: 'Import Data', icon: 'import' },
      { path: '/reports', label: 'Reports & Export', icon: 'reports' },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items)
