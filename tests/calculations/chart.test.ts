import { describe, expect, it } from 'vitest'
import {
  computeNiceTicks,
  getCategoryColor,
  trimTrailingEmptyCashFlowPoints,
  trimTrailingEmptyMonthly,
  CATEGORY_PALETTE,
} from '../../src/utils/chart'

describe('computeNiceTicks', () => {
  it('generates nice round ticks for large millions matching spec (0, 10M, 20M, 30M)', () => {
    // Spec: "Use 'nice' y-axis ticks (round numbers like 0 / 10M / 20M / 30M), not 9.5M / 19M / 28.5M."
    const result = computeNiceTicks(0, 28_500_000, 4)
    expect(result.domain).toEqual([0, 30_000_000])
    expect(result.ticks).toEqual([0, 10_000_000, 20_000_000, 30_000_000])
  })

  it('handles negative and positive range with zero included', () => {
    const result = computeNiceTicks(-5_000, 15_000, 5)
    expect(result.domain[0]).toBeLessThanOrEqual(-5_000)
    expect(result.domain[1]).toBeGreaterThanOrEqual(15_000)
    expect(result.ticks).toContain(0)
  })

  it('handles all-zero input gracefully', () => {
    const result = computeNiceTicks(0, 0)
    expect(result.domain).toEqual([0, 100])
    expect(result.ticks).toEqual([0, 25, 50, 75, 100])
  })

  it('handles small numbers cleanly', () => {
    const result = computeNiceTicks(0, 12, 5)
    expect(result.domain[0]).toBe(0)
    expect(result.domain[1]).toBeGreaterThanOrEqual(12)
    for (const t of result.ticks) {
      expect(Number.isFinite(t)).toBe(true)
    }
  })
})

describe('getCategoryColor', () => {
  it('is completely deterministic for the same category name', () => {
    const c1 = getCategoryColor('Business Income')
    const c2 = getCategoryColor('Business Income')
    expect(c1).toBe(c2)
    expect(CATEGORY_PALETTE).toContain(c1)
  })

  it('is case-insensitive and trims whitespace', () => {
    const c1 = getCategoryColor('Salary')
    const c2 = getCategoryColor('salary')
    const c3 = getCategoryColor('  Salary  ')
    expect(c1).toBe(c2)
    expect(c1).toBe(c3)
  })

  it('maps Other and others to neutral slate', () => {
    expect(getCategoryColor('Other')).toBe('#94a3b8')
    expect(getCategoryColor('other')).toBe('#94a3b8')
    expect(getCategoryColor('others')).toBe('#94a3b8')
  })

  it('maps empty and falsy input to neutral slate', () => {
    expect(getCategoryColor('')).toBe('#94a3b8')
  })
})

describe('trimTrailingEmptyCashFlowPoints', () => {
  it('trims trailing points where there is no movement', () => {
    const points = [
      { key: '2026-01', label: 'Jan', fullLabel: 'Jan 2026', inflow: 1000, outflow: 500, net: 500 },
      { key: '2026-02', label: 'Feb', fullLabel: 'Feb 2026', inflow: 2000, outflow: 800, net: 1200 },
      { key: '2026-03', label: 'Mar', fullLabel: 'Mar 2026', inflow: 0, outflow: 0, net: 0 },
      { key: '2026-04', label: 'Apr', fullLabel: 'Apr 2026', inflow: 0, outflow: 0, net: 0 },
    ]
    const trimmed = trimTrailingEmptyCashFlowPoints(points)
    expect(trimmed).toHaveLength(2)
    expect(trimmed.map((p) => p.key)).toEqual(['2026-01', '2026-02'])
  })

  it('preserves intermediate zero points if followed by active points', () => {
    const points = [
      { key: '2026-01', label: 'Jan', fullLabel: 'Jan 2026', inflow: 1000, outflow: 500, net: 500 },
      { key: '2026-02', label: 'Feb', fullLabel: 'Feb 2026', inflow: 0, outflow: 0, net: 0 },
      { key: '2026-03', label: 'Mar', fullLabel: 'Mar 2026', inflow: 500, outflow: 100, net: 400 },
      { key: '2026-04', label: 'Apr', fullLabel: 'Apr 2026', inflow: 0, outflow: 0, net: 0 },
    ]
    const trimmed = trimTrailingEmptyCashFlowPoints(points)
    expect(trimmed).toHaveLength(3)
    expect(trimmed.map((p) => p.key)).toEqual(['2026-01', '2026-02', '2026-03'])
  })

  it('returns all points if no points have movement', () => {
    const points = [
      { key: '2026-01', label: 'Jan', fullLabel: 'Jan 2026', inflow: 0, outflow: 0, net: 0 },
    ]
    const trimmed = trimTrailingEmptyCashFlowPoints(points)
    expect(trimmed).toHaveLength(1)
  })
})

describe('trimTrailingEmptyMonthly', () => {
  it('trims trailing empty months', () => {
    const points = [
      { month: 'Jan 2026', fullLabel: 'January 2026', amount: 100 },
      { month: 'Feb 2026', fullLabel: 'February 2026', amount: 200 },
      { month: 'Mar 2026', fullLabel: 'March 2026', amount: 0 },
      { month: 'Apr 2026', fullLabel: 'April 2026', amount: 0 },
    ]
    const trimmed = trimTrailingEmptyMonthly(points)
    expect(trimmed).toHaveLength(2)
    expect(trimmed.map((p) => p.month)).toEqual(['Jan 2026', 'Feb 2026'])
  })
})
