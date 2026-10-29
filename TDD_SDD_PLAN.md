# TDD/SDD Plan: Financial Encoder UI/UX Transformation

## Overview

This plan transforms the Financial Encoder Electron + React desktop application using **Test-Driven Development (TDD)** and **Specification-Driven Development (SDD)**. The goal is to improve accessibility, consistent design patterns, better data visualization, cleaner code structure, and modern React patterns across all 22 phases.

---

## Philosophy

- **Specification-Driven Development**: Define clear component specifications BEFORE implementation
- **Test-First**: Write tests before code (unit tests for utilities, integration tests for components)
- **Backward Compatible**: All changes maintain API compatibility or use proper versioning
- **Incremental**: Transform one component/page at a time, starting with foundation utilities

---

## Component/Page Transformation Roadmap

### Foundation (Phase 0)

| Focus | Specification | Tests | Implementation |
|-------|--------------|-------|----------------|
| **utils/finance.ts** | N/A (utilities) | Unit test `fmt()`, `formatCurrency()`, `formatCompactCurrency()`, `toFiniteNumber()`, `currencySymbol()` | Already exists - add tests |
| **utils/currency.ts** | N/A (utilities) | Unit test `fmt()`, `formatCurrency()`, `formatCompactCurrency()`, `currencySymbol()`, `toFiniteNumber()` | Already exists - add tests |
| **utils/dates.ts** | N/A (utilities) | Unit test `formatDate()`, `parseISODate()`, `todayFormatted()`, `toISODate()`, `customRangeInvalid()`, `dateSpanDays()` | Already exists - add tests |
| **utils/chart.ts** | N/A (utilities) | Unit test `computeNiceTicks()`, `computeChartYDomain()`, `trimTrailingEmptyCashFlowPoints()`, `trimTrailingEmptyMonthly()`, `getCategoryColor()` | Already exists - add tests |
| **utils/periods.ts** | N/A (utilities) | Unit test `periodRange()`, `cashFlowGranularity()`, `formatMonth()`, `customRangeInvalid()`, `dateSpanDays()` | Already exists - add tests |

### Navigation (Phase 1)

| File | Specification | Tests | Implementation |
|------|--------------|-------|----------------|
| **src/navigation.ts** | Structured NavSection/NavItem types with consistent icon naming; add `NAV_ITEM_VISIBILITY` for conditional rendering | Test `NAV_SECTIONS` structure, `NAV_ITEMS` flattening, icon name consistency | Refactor to use enum-based icon names; add visibility logic |

### TopBar Transformation (Phase 2)

| Specification | Details |
|--------------|---------|
| **Reduce redundant date/time logic** | Extract date display to `DateRangeContext`; TopBar receives pre-formatted date |
| **Remove hardcoded theme pill** | Theme management moved to SettingsContext with `useTheme` hook |
| **Extract keyboard shortcuts** | Create `useKeyboardShortcuts` hook; TopBar uses it |
| **Consistent heading pattern** | All page titles derived from `getPageInfo()`; TopBar delegates to page component |
| **Accessibility** | All interactive elements have proper `aria-label`, focus management, keyboard navigation |
| **Responsive design** | Theme pill collapses on mobile; greeting adapts to screen width |

**Test Strategy**:
- Unit test `TopBar` rendering with different pathnames
- Unit test `getPageInfo()` for all route patterns
- Accessibility a11y tests for aria-labels and keyboard handling

**New Files**:
- `src/hooks/useKeyboardShortcuts.ts` - extracted shortcut logic
- `src/hooks/useFormattedDate.ts` - date formatting hook

### LedgerPage Transformation (Phase 3)

| Specification | Details |
|--------------|---------|
| **Unify KPI card patterns** | Single `StatCard` component variant; props drive type (income/expense/capital) |
| **Eliminate duplicated KPI cards** | `LedgerPage` produces one `dash-summary` section regardless of type |
| **Consistent empty states** | All empty states use `EmptyState` component with standardized props |
| **Standardized table columns** | Single column definition pattern; `SORTABLE_COLUMNS` shared across all ledger pages |
| **Unified filter/search** | Single `TransactionFilter` type; consistent across all pages |

**Test Strategy**:
- Integration test `LedgerPage` with all type variants (income, expense, capital)
- Snapshot tests for KPI card renders
- Table column consistency tests

**Component Refactoring**:
- `StatCard` variant with type-driven styling
- `TransactionTable` shared component
- `TransactionFilter` unified filter component

**New Pages structure**:
- `Income` → uses `LedgerPage` with `type="income"` 
- `Expenses` → uses `LedgerPage` with `type="expense"`
- `Capital` → uses `LedgerPage` with `type="capital"`

### Dashboard Transformation (Phase 4)

| Specification | Details |
|--------------|---------|
| **Unified layout** | Replace `dash-main-col/dash-side-col` with `dash-grid` system; responsive columns |
| **KPI cards standardization** | All cards use `stat-card` variant with consistent substructure |
| **Chart integration** | `CashFlowChart` and `MonthlyAmountChart` use common tooltip/Datum types |
| **Recent transactions** | Standard card component with `RecentTransaction` item type |
| **Expense donut** | Single `CategoryProgressList` variant with `accentColor` prop |

**Test Strategy**:
- Integration test full Dashboard render
- Unit test `dash-grid` responsive behavior
- Chart tooltip consistency tests

**New Components**:
- `DashGrid` - responsive grid layout
- `StatCard` - unified KPI card
- `RecentTransaction` - recent transaction item

### Page Transformations (Phases 5-8)

| Page | Key Changes | Priority |
|------|-------------|----------|
| **Income.tsx** | Simplify to `LedgerPage` call with standardized props | High |
| **Expenses.tsx** | Simplify to `LedgerPage` call with standardized props | High |
| **Capital.tsx** | Simplify to `LedgerPage` call with standardized props | High |
| **CashFlow.tsx** | Refactor to use unified KPI cards and chart components | High |
| **Dashboard.tsx** | Full layout refactor per Phase 4 spec | Medium |
| **Reports.tsx** | Standardize report KPI cards and category lists | Medium |

### Charts Transformation (Phases 9-11)

| Chart | Specification | Tests |
|-------|--------------|-------|
| **CashFlowChart** | Consistent tooltip (`CashFlowTooltip`); unified labels; responsive height; computeNiceTicks for Y domain; `trimTrailingEmptyCashFlowPoints` applied | Unit test tooltip rendering, domain computation, trailing point trimming |
| **MonthlyAmountChart** | Consistent tooltip (`MonthlyTooltip`); nice ticks via `computeNiceTicks`; compact Y-axis; standardized empty state | Unit test tooltip, tick computation, empty state |
| **CategoryProgressList** | Single `DonutSlice` type; `accentColor` prop for type coloring; `Other` grouping consistently; accessible grid labels | Unit test slice generation,Other grouping, grid render |

**Shared Chart Utilities**:
- `ChartTooltip` base component with common props
- `ChartEmptyState` standardized empty state
- `useChartData` hook for common data transformations

### Utility TDD (Phases 12-14)

| Utility | Test Focus |
|---------|-----------|
| **finance.ts** (if created) | `fmt()` edge cases: NaN, negative, zero, compact vs standard |
| **currency.ts** | `fmt()` currency symbol resolution, compact formatting, negative number formatting |
| **dates.ts** | `formatDate()` all token variants, `parseISODate()` round-trip, `customRangeInvalid()` logic |
| **chart.ts** | `computeNiceTicks()` edge cases (zero, positive, negative), `getCategoryColor()` deterministic hashing, `computeChartYDomain()` |
| **periods.ts** | `periodRange()` all period keys, `cashFlowGranularity()` span-based buckets, `dateSpanDays()` date math |

### API Services (Phase 15)

| Specification | Details |
|--------------|---------|
| **src/services/api.ts** | Better typing for IPC wrappers; typed `categories.list()`, `transactions.list()`, `calculations.totals()` returns; error types unified |

**Test Strategy**:
- Mock API layer tests
- Type-safety tests (TypeScript compiler checks)

---

## Priority Ordering

### Foundation First (Must Do Before Pages)
1. **Utility tests** (`utils/` ) - Ensure all helpers work correctly
2. **Navigation** - Structural foundation for all pages
3. **TopBar** - Global header affects all pages

### Page Transformations (Parallel Where Possible)
4. **LedgerPage** - Core component used by 4 pages (Income, Expenses, Capital, CashFlow)
5. **Dashboard** - Main entry point; refactor after LedgerPage
6. **Income/Expenses/Capital** - Simplified after LedgerPage unification
7. **CashFlow** - Unique cash flow visualizations

### Charts (Parallel with Pages)
8. **CashFlowChart** - Major visualization component
9. **MonthlyAmountChart** - Monthly trend chart
10. **CategoryProgressList** - Donut/pie charts

### Polish (Last)
11. **Reports** - Uses many components but lower risk
12. **Settings** - Minor changes

---

## Test Strategy

### Unit Tests (Jest + React Testing Library)
- **Utilities**: Test pure functions without DOM
  - `fmt(amount, currency, options)` - edge cases
  - `formatDate(date, format)` - all token patterns
  - `computeNiceTicks(min, max)` - rounding behavior
  - `getCategoryColor(name)` - deterministic output
  - `cashFlowGranularity(range)` - period detection

- **Components**: Test rendering with RTL
  - `TopBar` - greeting, date, theme pill, shortcuts
  - `LedgerPage` - KPI cards, table, charts, empty states
  - `CashFlowChart` - tooltips, domain, step/bar rendering
  - `MonthlyAmountChart` - bar charts, tooltips, empty state
  - `CategoryProgressList` - donut slices, Other grouping, center value

### Integration Tests (RTL + Testing Library)
- Page-level render tests
- Navigation flow (TopBar → page content)
- Filter/search interactions
- Export functionality
- Settings/theme persistence

### Accessibility Tests (jest-axe)
- All interactive elements have meaningful labels
- Color contrast checks for data visualization
- Keyboard navigation through all pages
- Screen reader readable headings and descriptions

### Type Tests (TypeScript)
- Ensure all props interfaces are correct
- No `any` types in new code
- Backward compatibility of existing APIs

---

## Implementation Steps

### Step 1: Set up Testing Infrastructure
```bash
# Add test dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-axe ts-jest

# Update jest config for TypeScript support
# Add setup file for DOM environment
```

### Step 2: Write Utility Tests (Foundation)
Start with `utils/dates.ts` since it's the most fundamental:
```typescript
// utils/dates.test.ts
import { formatDate, parseISODate, todayFormatted, toISODate, customRangeInvalid, dateSpanDays } from './dates'

describe('formatDate', () => {
  it('formats with YYYY token', () => {
    const date = new Date(2024, 0, 15)
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15')
  })
  // ... more tokens
})

describe('parseISODate', () => {
  it('parses YYYY-MM-DD format', () => {
    const date = parseISODate('2024-01-15')
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(0)
    expect(date.getDate()).toBe(15)
  })
})
```

### Step 3: Refactor TopBar (Phase 2)
- Extract `useKeyboardShortcuts` hook
- Extract date formatting to hook
- Simplify component props
- Write tests first, then implement

### Step 4: Refactor LedgerPage (Phase 3)
- Create `StatCard` variant
- Create `TransactionTable` shared component
- Unify filter/search props
- Update Income/Expenses/Capital pages to use new props

### Step 5: Refactor Dashboard (Phase 4)
- Replace `dash-main-col/dash-side-col` with `dash-grid`
- Standardize KPI cards
- Integrate charts with common patterns

### Step 6: Transform Charts (Phases 9-11)
- `CashFlowChart`: Consistent tooltips, domain computation
- `MonthlyAmountChart`: Nice ticks, standardized empty state
- `CategoryProgressList`: Single source for donut rendering

### Step 7: Page-by-Page Transformation
- Income → use new LedgerPage props
- Expenses → use new LedgerPage props
- Capital → use new LedgerPage props
- CashFlow → refactor KPI cards and chart
- Dashboard → apply dash-grid layout
- Reports → standardize KPI and category displays

### Step 8: API Typing (Phase 15)
- Add TypeScript types for all API responses
- Unify error types
- Mock types for testing

---

## Backward Compatibility Strategy

### Version 1.0.0 → 2.0.0 Changes

| Old API | New API | Compatibility |
|---------|---------|---------------|
| `TopBar` theme pill prop | `useTheme` hook | Auto-migrated via settings |
| `LedgerPage` 20+ props | `LedgerPage` 15 props with defaults | Default values provided |
| `CashFlowChart` labels prop | `CashFlowLabels` type | Backward compatible |
| `CategoryProgressList` `accentColor` | `accentColor` prop | New, opt-in |
| `navigation.ts` `NAV_SECTIONS` | Same structure | Fully compatible |

### Migration Path
1. Add new components alongside old ones
2. Update pages one at a time
3. Deprecate old components after 2 major releases
4. Provide `compat` aliases if needed

---

## Success Metrics

- **Code quality**: 90%+ test coverage on utilities, 70%+ on components
- **Accessibility**: axe-core passes all pages; color contrast WCAG AA
- **Consistency**: All KPI cards follow same pattern; all tables use same columns
- **Performance**: No runtime penalty; chart rendering optimized with `useMemo`
- **Maintainability**: New developers can understand component props without digging into implementation
- **Modern React**: Hooks over class patterns; functional components throughout

---

## Notes

1. **22 completed phases** - This plan builds on existing work, not from scratch
2. **Backward compatibility** is critical - existing user data and settings must persist
3. **Incremental approach** - transform one component at a time, test after each
4. **TDD discipline** - write test → confirm fails → implement → confirm passes
5. **SDD discipline** - specification document before each component implementation

---

## File Transformations Summary

| Component/Page | Key Changes |
|---------------|-------------|
| `TopBar.tsx` | Extract hooks, simplify props, add a11y |
| `LedgerPage.tsx` | Unify KPI cards, standardize table, consolidate props |
| `Dashboard.tsx` | Replace grid layout, standardize cards, integrate charts |
| `Income.tsx`/`Expenses.tsx`/`Capital.tsx` | Simplify to LedgerPage call |
| `CashFlow.tsx` | Refactor KPI cards, unified chart |
| `CashFlowChart.tsx` | Consistent tooltip, nice ticks |
| `MonthlyAmountChart.tsx` | Standardized empty state, nice ticks |
| `CategoryProgressList.tsx` | Unified donut, Other grouping |
| `utils/chart.ts` | Add/test utilities |
| `utils/periods.ts` | Add/test utilities |
| `navigation.ts` | Structured nav items |
| `services/api.ts` | Better typing |