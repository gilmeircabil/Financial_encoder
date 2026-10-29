# UI/UX Transformation Plan: TDD + SDD Approach

## Overview
This plan transforms the Financial Encoder application's UI/UX using **Test-Driven Development (TDD)** and **Specification-Driven Development (SDD)**. The goal is to create a consistent, accessible, and modern financial desktop application while maintaining full backward compatibility.

## Current State Assessment

### Strengths
- Solid Foundation
- 22 development phases completed (PHASES.md)
- Clean git working tree
- Well-structured Electron + React + TypeScript + Vite project
- Comprehensive test suite already exists (tests/security/validation.test.ts)
- IPC layer well-defined with typed contracts
- SQLite database with better-sqlite3
- Electron electron-builder packaging works

### Weaknesses Target Areas
1. **Inconsistent UI patterns** across pages (Income/Expenses/Capital/CashFlow/Dashboard)
2. **Duplicated KPI card code** in LedgerPage + Dashboard pages
3. **Hardcoded colors/values** in charts (Recharts components)
4. **Varied empty states** and no consistent messaging
5. **Accessibility gaps** (missing aria-labels, focus management)
6. **Redundant date/time logic** in TopBar component
7. **Inconsistent table patterns** in transaction ledgers
8. **Chart configurations** not themable or configurable

---

## SDD Specification Framework

### Core Design Principles
| Principle | Description |
|-----------|-------------|
| **Single Source of Truth** | All data computations live in service layer; React only renders |
| **Component Composability** | Shared components (KPI cards, tables, charts) accept props, never hardcode |
| **Accessibility First** | All interactive elements have aria-labels; keyboard navigable; color contrast > 4.5:1 |
| **Design Token Driven** | Colors, spacing, typography come from CSS variables, not hardcoded values |
| ** backward Compatible** | New props default to existing values; no breaking API changes |
| **Offline-First UI** | All states handle no-data scenarios gracefully |

---

## Phase Plan (Sprint-Like Structure)

### Phase 1: Foundation & Utility TDD
**Goal**: Establish test infrastructure and fix utility functions

**Specifications:**
- `utils/currency.ts` - Currency formatting with proper minor-unit handling
- `utils/dates.ts` - Date parsing/formatting with multiple format support
- `utils/chart.ts` - Chart data transformation utilities
- `utils/periods.ts` - Period granularity calculations

**TDD Cycle:**
1. Write tests for existing utility behaviors (ensure no regression)
2. Run tests → verify they pass with current implementation
3. Refactor utilities to be more robust
4. Export new typed interfaces for use across components

**Deliverables:**
- [`utils/currency.test.ts`](tests/utilities/currency.test.ts) - currency formatting tests
- [`utils/dates.test.ts`](tests/utilities/dates.test.ts) - date parsing tests  
- [`utils/chart.test.ts`](tests/utilities/chart.test.ts) - chart data transform tests
- [`utils/periods.test.ts`](tests/utilities/periods.test.ts) - period granularity tests
- Updated type exports from `src/types/utils.ts`

---

### Phase 2: Shared Component Library (SDD First)
**Goal**: Build reusable components used across all pages

**Specifications & Tests:**

#### 2.1 `KpiCard` Component
```typescript
// Spec: KpiCard(props: { label, value, currencyCode, trend?, trendLabel?, ... })
// - Card with icon, label, value, optional trend indicator
// - Color themes: positive/negative/neutral/ok/warn/danger
// - Compact and expanded variants
// - Accessible: role="region", aria-label required
```

**Tests:** [`components/ui/KpiCard.test.ts`](components/ui/KpiCard.test.ts)
- Renders with all props
- Accessible role and labels
- Trend indicator shows correctly
- Color variants apply correct classes

#### 2.2 `EmptyState` Enhanced
```typescript
// Spec: EmptyState(props: { icon, title, description, button?, ctx? })
// - Consistent iconography (from phosphor or lucide-react)
// - Action button with onClick
// - Description can be string or ReactNode
// - Multiple size variants
```

**Tests:** [`components/ui/EmptyState.test.ts`](components/ui/EmptyState.test.ts)
- Renders icon, title, description
- Button onClick fires correctly
- Different size variants apply correct classes
- Accessibility attributes present

#### 2.3 `PageHeader` Unified
```typescript
// Spec: PageHeader(props: { title, description, actions? })
// - Consistent heading hierarchy
// - Action area on right side
// - Breadcrumbs optional
// - responsive down to mobile widths
```

**Tests:** [`components/ui/PageHeader.test.ts`](components/ui/PageHeader.test.ts)
- Title and description render
- Actions section optional
- Click on action buttons fires

#### 2.4 `TransactionTable` Shared
```typescript
// Spec: TransactionTable(props: { columns, data, onEdit, onDelete, selection?, ... })
// - Configurable column definitions
// - Row selection with checkboxes
// - Sortable columns with arrow indicators
// - Bulk action bar when rows selected
// - Empty state when no data
```

**Tests:** [`components/tables/TransactionTable.test.ts`](components/tables/TransactionTable.test.ts)
- Columns render with correct headers
- Data rows map correctly
- Edit/delete buttons have correct labels
- Selection state management works

---

### Phase 3: Page Transformations (TDD per Page)

#### 3.1 Dashboard (`src/pages/Dashboard/Dashboard.tsx`)
**Current Issues:**
- Mixed `dash-main-col` / `dash-side-col` layout
- KPI cards duplicated from LedgerPage pattern
- Chart integration could be cleaner
- Inconsistent date range selector placement

**New Specification:**
- Three-column layout: KPIs | Chart | Side panel (all responsive)
- KPI cards from shared `KpiCard` component
- Spline/curve chart from enhanced `CashFlowChart`
- Recent transactions from shared `TransactionTable`
- Expense categories from enhanced `CategoryProgressList`

**TDD Workflow:**
1. Write [`src/pages/Dashboard/Dashboard.test.tsx`](src/pages/Dashboard/Dashboard.test.tsx) - snapshot + behavior tests
2. Refactor Dashboard to use shared components
3. Migrate KPI cards to `KpiCard` instances
4. Replace chart with `CashFlowChart` component
5. Run tests → ensure 100% pass
6. Update imports across app

**Deliverable:** New `Dashboard.tsx` using 80% shared components

#### 3.2 Transactions (`src/pages/Transactions/Transactions.tsx`)
**Current Issues:**
- Complex sort/filter state management
- Bulk selection logic embedded
- Table columns defined inline
- Search and filter tabs duplicated

**New Specification:**
- Use shared `TransactionTable` component
- Filter tabs component reusable
- Global search integrated with table
- Running balance as optional column prop

**TDD Workflow:**
1. Write [`src/pages/Transactions/Transactions.test.tsx`](src/pages/Transactions/Transactions.test.tsx)
2. Extract `TransactionTable` usage
3. Keep page-level logic (searchParams, date range, type filter)
4. Tests verify table interacts correctly with page state

**Deliverable:** `Transactions.tsx` delegates table rendering to `TransactionTable`

#### 3.3 Income (`src/pages/Income/Income.tsx`)
**Current Issues:**
- LedgerPage prop-passing is verbose
- EmptyState config duplicated from Expenses pattern
- Category distribution chart hardcoded

**New Specification:**
- `LedgerPage` with simplified props (use defaults)
- `EmptyState` with standardized button text
- `CategoryProgressList` with enhanced empty states
- Top/bottom category labels from shared computation

**TDD Workflow:**
1. Write [`src/pages/Income/Income.test.tsx`](src/pages/Income/Income.test.tsx)
2. Simplify LedgerPage prop defaults
3. Test that income-specific behaviors still work
4. Verify category breakdown renders correctly

#### 3.4 Expenses (`src/pages/Expenses/Expenses.tsx`)
**Current Issues:**
- Similar to Income but with expense-specific patterns
- AmountPrefix="-" hardcoded
- Category filtering different

**New Specification:**
- LedgerPage with `amountPrefix="-"`, `amountClass="cf-negative"`
- Expense-specific empty state messages
- Category filtering preserved

#### 3.5 Capital (`src/pages/Capital/Capital.tsx`)
**Current Issues:**
- Split layout (category breakdown + monthly chart)
- Capital types: ['capital', 'withdrawal']
- KPI cards different structure
- Type filter for capital types

**New Specification:**
- Retain split layout but use shared cards
- `KpiCard` for Net Equity, Capital Added, Total Withdrawn
- `MonthlyAmountChart` with `kind="capital"`
- Capital type filter preserved

#### 3.6 Cash Flow (`src/pages/CashFlow/CashFlow.tsx`)
**Current Issues:**
- Summary KPI cards complex
- Monthly breakdown table complex
- Coverage ratio calculation inline

**New Specification:**
- Summary cards from `KpiCard` 
- Monthly table from shared patterns
- Coverage ratio as KPI card footer
- CashFlowChart component for trajectory

---

### Phase 4: Chart System Refactor (TDD First)

**Goal**: Unified chart configuration with design tokens

**Components to Transform:**
1. `src/components/charts/CashFlowChart.tsx` → use design tokens
2. `src/components/charts/MonthlyAmountChart.tsx` → use design tokens  
3. `src/components/ui/CategoryProgressList.tsx` → consistent donut pattern

**New Design Token System:**
```scss
// src/styles/_variables.scss
$color-primary: #18181b;
$color-surface: #242426;
$color-on-surface: #f4f4f3;
$color-border: #a8a8ae;
$color-success: #34c751;
$color-warning: #ff9f0a;
$color-error: #ff3b30;

// Chart-specific
$chart-inflow: #7048e8;
$chart-outflow: #f59e0b;
$chart-net: #38bdf8;
$chart-background: #ffffff;
```

**TDD Workflow:**
1. Write chart utility tests [`tests/utilities/chart.test.ts`](tests/utilities/chart.test.ts)
2. Transform each chart component to accept `color` props
3. Replace hardcoded colors with design token references
4. Ensure all existing chart behaviors unchanged
5. Run full test suite

---

### Phase 5: TopBar & Navigation Revamp (SDD First)

**TopBar.tsx Specific Improvements:**
- Remove redundant `useEffect` date timer (use CSS `:hover` or reduce frequency)
- Theme pill becomes simple button with proper aria-pressed state
- Keyboard shortcut (Ctrl+N) documented in accessible way
- Search form improves: label element, better placeholder messaging

**New Specification for TopBar:**
```typescript
// Simplified: remove internal state management
// - Theme toggle becomes useSettings() + setSetting() only
// - Date display: just formatDate(now, dateFormat) - remove interval timer
// - Shortcut: show "Ctrl+N" tooltip, don't capture globally (delegate to page)
// - Search: proper <label> element wrapping input
```

**Tests:** [`src/components/layout/TopBar.test.tsx`](src/components/layout/TopBar.test.tsx)
- Greeting renders based on hour
- Theme toggle calls setSetting
- Search form has label association
- Minimal keyboard event handling

**Navigation:** 
- `src/navigation.ts` already well-structured
- Ensure all `NavItem` have proper `_icon` names matching phosphor/icons
- Add missing `cashflow` icon reference if needed

---

### Phase 6: Test Suite Expansion & Branding

**Existing Tests to Preserve:**
- `tests/security/validation.test.ts` - all 12 test groups
- Must not break with any UI changes

**New Test Files:**
- [`tests/ui/KpiCard.test.ts`](tests/ui/KpiCard.test.ts)
- [`tests/ui/EmptyState.test.ts`](tests/ui/EmptyState.test.ts)
- [`tests/ui/PageHeader.test.ts`](tests/ui/PageHeader.test.ts)
- [`tests/components/TransactionTable.test.ts`](tests/components/TransactionTable.test.ts)
- [`tests/charts/CashFlowChart.test.ts`](tests/charts/CashFlowChart.test.ts)
- [`tests/charts/MonthlyAmountChart.test.ts`](tests/charts/MonthlyAmountChart.test.ts)

**Branding Updates:**
- Update app name "Acorn" → "Financial Encoder" (or keep as alias)
- Update sidebar footer text "Acorn Suite" → branding appropriate
- Update TopBar greeting/appName defaults
- Consider color scheme improvements (currently light/dark only)

---

### Phase 7: Integration & Regression Testing

**Test Commands:**
```bash
npm test              # Run all vitest tests
npm run typecheck     # TypeScript verification
npm run lint          # Lint checking
```

**Integration Strategy:**
1. Run existing test suite first → document baseline
2. Apply Phase 1 changes → re-run tests → ensure 100% pass
3. Apply each subsequent phase → re-run tests
4. Fix any failures immediately (TDD discipline)
5. Final integration test: run the Electron app visually

**Regression Checklist:**
- [ ] All 12 security validation test groups pass
- [ ] Transaction creation/deletion still works
- [ ] Date range filtering works across all pages
- [ ] Export CSV functionality unchanged
- [ ] OCR parse functionality unchanged
- [ ] Backup/create/restore still works
- [ ] Theme switch light/dark preserves
- [ ] Electron dev server starts without errors

---

### Phase 8: Documentation & Handoff

**Generated Documentation:**
- `USER_GUIDE.md` updates for new UI patterns
- Component API documentation in `src/types/`
- Design token reference in `src/styles/_variables.scss`
- TDD/SDD methodology notes for future developers

**Onboarding Notes:**
- New developers can add pages by:
  1. Define page data fetching
  2. Use shared `LedgerPage` with appropriate props
  3. Use shared `TransactionTable` for transaction lists
  4. Use `KpiCard` for KPI displays
  5. Add charts via `CashFlowChart` or `MonthlyAmountChart`

---

## Priority Order & Critical Path

| Priority | Phase | Key Deliverable | Dependencies |
|----------|-------|----------------|--------------|
| **P0** | 1 | Utility tests + refactors | None |
| **P0** | 2 | Shared component library (KpiCard, EmptyState, PageHeader, TransactionTable) | Phase 1 |
| **P1** | 3 | Dashboard transformation | Phase 2 |
| **P1** | 3 | Transactions transformation | Phase 2 |
| **P1** | 3 | Income/Expenses/Capital refinements | Phase 2 |
| **P1** | 3 | Cash Flow transformation | Phase 2 |
| **P2** | 4 | Chart system refactor with design tokens | Phase 1 |
| **P2** | 5 | TopBar & navigation simplification | Phase 1 |
| **P2** | 6 | Test suite expansion | Throughout |
| **P3** | 7 | Integration & regression testing | All previous |
| **P3** | 8 | Documentation & handoff | All previous |

---

## Success Metrics

### Technical Criteria
- [ ] 100% of existing tests pass (`npm test`)
- [ ] TypeScript compilation succeeds (`npm run typecheck`)
- [ ] No lint errors (`npm run lint`)
- [ ] Electron app launches successfully
- [ ] All pages responsive down to 1024px width

### UI/UX Criteria
- [ ] Consistent KPI card pattern across all pages
- [ ] Uniform empty states with actionable messaging
- [ ] Accessible color contrast (verify with axe-core)
- [ ] Keyboard navigable throughout (Tab order, shortcuts)
- [ ] Mobile-responsive at minimum 1024px width
- [ ] Dark/Theme switch preserves state correctly

### Business Criteria
- [ ] No loss of existing functionality
- [ ] All data operations (CRUD, export, backup, OCR) work identically
- [ ] User workflows unchanged (add transaction, filter, export, etc.)
- [ ] Performance not degraded (chart rendering, data fetching)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | TDD: write tests BEFORE refactoring; run full suite after each phase |
| Chart visual regression | Use screenshotdiff or snapshot tests; verify chart data unchanged |
| Accessibility oversights | Include axe-core tests in CI; manual keyboard testing |
| Performance degradation | Profile chart rendering; use `useMemo` extensively; virtualize large lists |
| Team adoption of new patterns | Documentation in Phase 8; component library with props tables |
| Timeline overruns | Time-box each phase; if behind, defer lower-priority UI polish |

---

## Next Immediate Steps

1. **Start Phase 1**: Write utility tests and ensure they pass
2. **Create component library** in Phase 2 (KpiCard, EmptyState, PageHeader, TransactionTable)
3. **Commit baseline** after Phase 2 with all shared components working
4. **Proceed page-by-page** in Phase 3, running tests after each page
5. **Daily**: Run `npm test` to catch regressions early

---

## File Transformation Map

| Source File | Target Pattern | Shared Component Used |
|-------------|---------------|----------------------|
| `LedgerPage.tsx` | Simplified props + use shared cards | `KpiCard`, `CategoryProgressList`, `TransactionTable` |
| `Dashboard.tsx` | Three-column layout | `KpiCard`×4, `CashFlowChart`, `TransactionTable` |
| `Transactions.tsx` | Use `TransactionTable` | `TransactionTable` + shared filters |
| `Income/Expenses/Capital/CashFlow` | Minimal changes | `LedgerPage` + `KpiCard` + category charts |
| `TopBar.tsx` | Simplified, accessible | `useSettings()`, reduced state |
| `charts/` | Design token colors | Updated `CashFlowChart`, `MonthlyAmountChart` |
| `utils/` | Tested utilities | `currency.ts`, `dates.ts`, `chart.ts`, `periods.ts` |
| `navigation.ts` | Keep, add missing icons | Already structured |
| `styles/` | Design tokens SCSS | `_variables.scss` enhancements |

---

This plan provides a complete SDD/TDD roadmap for transforming the Financial Encoder's UI/UX while maintaining all existing functionality and improving consistency, accessibility, and maintainability.