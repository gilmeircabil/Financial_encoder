# Financial Encoder — Component API Reference

This document outlines the API for shared UI components used across the application to ensure consistency, accessibility, and maintainability.

## Shared UI Components

### `KpiCard`
Renders a metric card with optional trends, icons, and actions.

```typescript
interface KpiCardProps {
  label: string;
  value: number;
  currencyCode: string;
  variant?: 'positive' | 'negative' | 'neutral' | 'ok' | 'warn' | 'danger';
  trend?: number; // e.g. 0.15 for +15%
  trendLabel?: string;
  compact?: boolean;
  icon?: IconName;
  actionLink?: string;
  actionAriaLabel?: string;
  displayValue?: string; // Optional override for the main value text
}
```

### `EmptyState`
Renders a centered message for empty data views.

```typescript
interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  children?: ReactNode; // Typically used for action buttons
}
```

### `PageHeader`
Unified page title and action area.

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode; // Optional action buttons on the right
}
```

### `TransactionTable`
Handles large tabular data sets with sorting, selection, and formatting.

```typescript
interface TransactionColumn {
  key: string;
  label: string;
  className?: string;
  sortable?: boolean;
}

interface TransactionTableProps {
  columns: TransactionColumn[];
  data: any[];
  currencyCode?: string;
  dateFormat?: string;
  showBalanceColumn?: boolean;
  selection?: Set<number>;
  allSelected?: boolean;
  someSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  onToggleSelectAll?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (id: number) => void;
  onSort?: (key: string) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}
```

---

## Design Tokens (`src/utils/chartTheme.ts`)

Charts and visualization components must consume tokens from `CHART_COLORS`, `CHART_SPACING`, and `CHART_TYPOGRAPHY`.

### Key Chart Design Tokens
- **Colors**:
  - `CHART_COLORS.income` (green), `CHART_COLORS.expense` (amber), `CHART_COLORS.capital` (purple), `CHART_COLORS.withdrawal` (orange).
  - `CHART_COLORS.inflow` (purple), `CHART_COLORS.outflow` (amber), `CHART_COLORS.netFlow` (blue).
- **Spacing**: `barRadius` (4px), `maxBarSize` (48px).
- **Typography**: Axis tick fonts inherited, font sizes standardized via `CHART_TYPOGRAPHY`.

---

## TDD/SDD Methodology

- **Always include tests**: Every component must have a corresponding `.test.tsx` file in `tests/components/`.
- **Accessibility Check**: Use `vitest-axe` to ensure new components have `toHaveNoViolations()`.
- **Component Lifecycle**:
  1. Define `Props` interface.
  2. Implement component based on `Props`.
  3. Write comprehensive unit tests for all prop permutations, empty states, and accessibility violations.
  4. Ensure 100% strict TypeScript typing.
