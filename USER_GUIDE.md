# Financial Encoder — User Guide

Financial Encoder is a modern desktop application that keeps your financial records entirely on **your own computer**. Nothing is sent to the internet, and you do not need to install any developer tools or manage cloud subscriptions.

---

## Table of Contents
1. [Installing & Opening](#1-installing--opening)
2. [Navigation & Interface Overview](#2-navigation--interface-overview)
3. [Dashboard](#3-dashboard)
4. [Adding & Managing Transactions](#4-adding--managing-transactions)
5. [Specialized Ledgers (Income, Expenses, Capital, Cash Flow)](#5-specialized-ledgers)
6. [Reports & Exports](#6-reports--exports)
7. [Importing Data (CSV / Excel)](#7-importing-data)
8. [Backups & Portability](#8-backups--portability)
9. [Keyboard Shortcuts](#9-keyboard-shortcuts)
10. [Accessibility Features](#10-accessibility-features)

---

## 1. Installing & Opening

### Installation
1. Double-click `Financial-Encoder-Setup-1.0.13.exe` (or your platform installer).
2. Follow the installer instructions (choose a destination folder or use default).
3. Open **Financial Encoder** from the Start Menu or desktop shortcut.

### Data Location
- Your data lives locally in `%APPDATA%\FinancialEncoder\` (Windows) or `~/Library/Application Support/FinancialEncoder/` (macOS).
- Reinstalling or updating the app **never deletes** your financial records.

---

## 2. Navigation & Interface Overview

The interface consists of a persistent **Top Bar** and a **Left Sidebar**:

### Top Bar
- **Greeting & Date**: Time-aware greeting and formatted current date.
- **Global Search**: Type to search across all transactions instantly.
- **Theme Switcher**: One-click toggle between **Light**, **Dark**, and **System** mode.
- **New Transaction (`Ctrl+N`)**: Quick dropdown button to create Income, Expense, Capital, Withdrawal, Asset, or Liability transactions.

### Left Sidebar
- 📊 **Dashboard** — Overview, KPI metrics, recent activity & category charts
- 💰 **Income** — Income ledger, category breakdown & monthly trends
- 💸 **Expenses** — Expense ledger, category breakdown & monthly trends
- 🏦 **Capital** — Equity, capital contributions & owner withdrawals
- 📈 **Cash Flow** — Inflow/outflow trajectory & coverage ratios
- 📋 **Transactions** — Unified transaction list with filters, sorting & bulk actions
- 📑 **Reports** — Period summaries, financial statements & exports
- ⚙️ **Settings** — App settings, currency defaults, backups & theme options

---

## 3. Dashboard

The **Dashboard** provides a 3-column consolidated overview:

### Key Metrics (KPI Cards)
- **Net Worth**: Total assets minus liabilities
- **Monthly Net**: Income minus expenses for current period
- **30-Day Cash Flow**: Rolling inflow vs outflow position
- **Savings Rate**: Percentage of income retained

### Charts & Recent Activity
- **Cash Flow Trajectory**: Grouped bar chart comparing inflows and outflows over time with a net cash flow trendline.
- **Category Progress**: Donut breakdown showing top expense or income categories.
- **Recent Activity**: Quick view of the latest 5 transactions with direct edit/delete actions.

---

## 4. Adding & Managing Transactions

### Adding a Transaction
1. Click **+ New Transaction** in the top bar or press **`Ctrl+N`**.
2. Select the transaction type: **Income**, **Expense**, **Capital Contribution**, **Owner Withdrawal**, **Asset**, or **Liability**.
3. Fill in:
   - **Date**: Select or type date (`YYYY-MM-DD`).
   - **Description**: Vendor, client, or purpose name.
   - **Category**: Select from dropdown or create a new category.
   - **Amount**: Enter positive currency value.
   - **Notes** *(optional)*: Additional details or invoice references.
4. Save. Figures update across all ledgers instantly.

### Unified Transaction List (`/transactions`)
- **Sortable Columns**: Click Date, Description, Amount, Type, or Category headers to sort.
- **Row Selection**: Click checkboxes or press **`Space`** on a focused row.
- **Bulk Delete**: Select multiple rows and click **Delete Selected** in the selection bar.
- **Running Balance**: View cumulative balance position row-by-row.
- **Filters**: Filter by date range presets (This Month, Last Month, Year to Date) or custom range.

---

## 5. Specialized Ledgers

Each specialized ledger streamlines view for specific transaction types:

### Income (`/income`)
- Focuses purely on revenue and inflows.
- Shows total gross income, average transaction size, and category distribution.

### Expenses (`/expenses`)
- Tracks operational costs and outflows.
- Displays top spending categories and monthly expense trend bars.

### Capital (`/capital`)
- Split layout tracking **Equity**, **Capital Added**, and **Owner Withdrawals**.
- Includes net equity balance card.

### Cash Flow (`/cashflow`)
- Measures liquidity and coverage ratio (`Inflows / Outflows`).
- Granularity toggle: **Month**, **Week**, or **Day** step-lines.

---

## 6. Reports & Exports

1. Open **Reports** from the sidebar.
2. Choose your date period: **This Month**, **Last Month**, **This Quarter**, **This Year**, or **Custom**.
3. Review:
   - Income Statement
   - Cash Flow Summary
   - Category Breakdown
4. Export:
   - **CSV**: Raw spreadsheet export.
   - **XLSX**: Multi-sheet formatted Excel workbook.
   - **PDF**: Formatted printable statement.

---

## 7. Importing Data

1. Open **Import** from the sidebar.
2. Click **Select file** or drag & drop a `.csv` or `.xlsx` file.
3. Review column mapping (e.g. map your CSV's "Date" column to Financial Encoder's "Date").
4. Preview rows and check for invalid entries.
5. Click **Import**. Invalid or skipped rows are listed in a warning summary.

---

## 8. Backups & Portability

### Creating a Backup
1. Go to **Settings → Backups**.
2. Click **Create Backup** for an internal snapshot.
3. Click **Export Backup file (`.febak`)** to save a portable file to a USB drive or cloud backup folder.

### Restoring a Backup
1. Go to **Settings → Backups**.
2. Click **Restore from file…** and select your `.febak` file.
3. The app verifies integrity and creates a safety snapshot of current data before restoring.

---

## 9. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | Open New Transaction menu |
| `Ctrl+Shift+N` | New Income shortcut |
| `Ctrl+Alt+N` | New Expense shortcut |
| `/` | Focus search bar |
| `Ctrl+E` | Export current report |
| `Ctrl+F` | Open/close filters |
| `Escape` | Close dialogs / clear active search |
| `Tab` / `Shift+Tab` | Navigate interactive elements |
| `Enter` / `Space` | Activate button or toggle row checkbox |

---

## 10. Accessibility Features

Financial Encoder is built with **Accessibility First** principles compliant with WCAG 2.1 AA standards:
- **Keyboard Navigable**: Every table, dialog, form, and chart legend can be operated via keyboard alone.
- **High Contrast**: Theme colors strictly meet 4.5:1 text-to-background contrast requirements.
- **Screen Reader Support**: All icons carry `aria-hidden="true"`, buttons carry descriptive `aria-label` tags, and KPI tiles use `role="region"`.
- **Automated Regression Testing**: Every build passes `axe-core` accessibility checks.

---

*Financial Encoder v1.0.13 — Privacy-focused, local-first financial management.*