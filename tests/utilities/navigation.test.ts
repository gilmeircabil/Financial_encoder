import { describe, expect, it } from 'vitest'
import { NAV_SECTIONS, NAV_ITEMS } from '../../src/navigation'
import type { IconName } from '../../src/components/ui/Icon'

describe('navigation module', () => {
  describe('NAV_SECTIONS', () => {
    it('has expected sections', () => {
      expect(NAV_SECTIONS).toHaveLength(4)
      expect(NAV_SECTIONS.map((s) => s.title)).toEqual([
        'Overview',
        'Ledgers',
        'Data & Tools',
        'System',
      ])
    })

    it('Overview section has correct items', () => {
      const overview = NAV_SECTIONS.find((s) => s.title === 'Overview')
      expect(overview?.items).toHaveLength(3)
      expect(overview?.items.map((i) => i.path)).toEqual([
        '/dashboard',
        '/transactions',
        '/cash-flow',
      ])
    })

    it('Ledgers section has correct items', () => {
      const ledgers = NAV_SECTIONS.find((s) => s.title === 'Ledgers')
      expect(ledgers?.items).toHaveLength(3)
      expect(ledgers?.items.map((i) => i.path)).toEqual([
        '/income',
        '/expenses',
        '/capital',
      ])
    })

    it('Data & Tools section has correct items', () => {
      const data = NAV_SECTIONS.find((s) => s.title === 'Data & Tools')
      expect(data?.items).toHaveLength(3)
      expect(data?.items.map((i) => i.path)).toEqual([
        '/documents',
        '/import',
        '/reports',
      ])
    })

    it('System section has correct items', () => {
      const system = NAV_SECTIONS.find((s) => s.title === 'System')
      expect(system?.items).toHaveLength(1)
      expect(system?.items.map((i) => i.path)).toEqual(['/settings'])
    })
  })

  describe('NAV_ITEMS', () => {
    it('flattens all items from sections', () => {
      expect(NAV_ITEMS).toHaveLength(10)
    })

    it('contains all expected paths', () => {
      const paths = NAV_ITEMS.map((i) => i.path)
      expect(paths).toEqual([
        '/dashboard',
        '/transactions',
        '/cash-flow',
        '/income',
        '/expenses',
        '/capital',
        '/documents',
        '/import',
        '/reports',
        '/settings',
      ])
    })

    it('all items have valid IconName', () => {
      const validIcons: IconName[] = [
        'dashboard',
        'transactions',
        'cashflow',
        'income',
        'expenses',
        'capital',
        'documents',
        'import',
        'reports',
        'settings',
      ]
      for (const item of NAV_ITEMS) {
        expect(validIcons).toContain(item.icon)
      }
    })

    it('all items have non-empty labels', () => {
      for (const item of NAV_ITEMS) {
        expect(item.label).toBeTruthy()
        expect(typeof item.label).toBe('string')
      }
    })
  })

  describe('NavItem structure', () => {
    it('each item has path, label, and icon', () => {
      for (const item of NAV_ITEMS) {
        expect(item).toHaveProperty('path')
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('icon')
      }
    })
  })
})