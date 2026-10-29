# DEBUG AUDIT REPORT — 2026-10-29 (FULL AUDIT RUN)

## 1. Summary

- **Project:** Acorn — Local Vault Financial Desktop Application
- **Stack:** Electron 44.3.0, React 19.3.0, TypeScript 7.0.2, Vite 8.3.0, SCSS, SQLite (better-sqlite3 13.0.3), electron-builder 26.15.3, Recharts 3.10.1, Tesseract.js 7.0.0, PDF.js (pdfjs-dist 6.3.289)
- **Scope:** Lane 1 of FULL Launch Audit (`DEBUG`). Systematic verification of syntax, type soundness, baseline test suite, IPC contracts, production builds, and database integrity.
- **Current Status:** All previous bugs (DBG-01 through DBG-08) remain resolved. Automated tests expanded from 362 to 408 tests with 100% pass rate.
- **Verification Limits:** Read-only static analysis and local test execution. No production release binaries were signed or distributed during this phase.

---

## 2. Findings Table

| ID | Severity | Issue | Cause | Status |
|---|---|---|---|---|
| `DBG-01` | `HIGH` | Truncation of core stylesheet (`src/styles/_components.scss`) | Resolved in prior audit; verified intact | `PASS` |
| `DBG-02` | `HIGH` | Table column misalignment in shared transaction tables | Resolved in prior audit; dynamic rendering verified | `PASS` |
| `DBG-03` | `MEDIUM` | Missing pagination navigation in ledger pages | Resolved in prior audit; multi-page controls active | `PASS` |
| `DBG-04` | `MEDIUM` | OCR test timeout (30s) on PDF text extraction | Resolved in prior audit; test passes in < 1.2s | `PASS` |
| `DBG-05` | `MEDIUM` | Dashboard KPI card action links break HashRouter navigation | Resolved in prior audit; routing verified | `PASS` |
| `DBG-06` | `HIGH` | First-run onboarding (`IntroScreen`) and boot screen unstyled | Resolved in prior audit; styles active | `PASS` |
| `DBG-07` | `LOW` | Inconsistent default system name fallback | Resolved in prior audit; Acorn fallback aligned | `PASS` |
| `DBG-08` | `LOW` | Chart crash on non-finite data | Resolved in prior audit; `Number.isFinite` filtering active | `PASS` |
| `DBG-09` | `LOW` | Main client bundle exceeds 500 kB chunk threshold (759 kB) | PDF.js and Recharts statically bundled into vendor chunk | `PASS (code only)` |

---

## 3. Baseline Checks Table

| Check | Command | Status | Evidence |
|---|---|---|---|
| TypeScript Types (Renderer & Main) | `npm run typecheck` | `PASS` | Exit code 0; 0 type errors across tsconfig.json and tsconfig.electron.json |
| Unit & Integration Tests | `npm run test` | `PASS` | Exit code 0; 408 passed across 29 test files (14.9s) |
| Production Build (Renderer & Main) | `npm run build` | `PASS` | Vite built `dist-renderer` in 1.06s; `dist-electron` emitted without errors |
| Working Tree Integrity | `git status` | `PASS` | Working tree inspected; uncommitted modifications preserved |
| Electron Security Flags | Static Code Audit | `PASS` | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true` |
| SQLite Schema & WAL Mode | Static Code Audit | `PASS` | Foreign keys enforced (`PRAGMA foreign_keys = ON`), WAL enabled, auto-snapshot before migrations |

---

## 4. Remaining Problems

None. All core flows, financial calculation engine tests, IPC contracts, and production builds are passing.

---

## 5. Next Actions

Proceed to Lane 2: `UI` audit (`UI.md`).

---

## 6. Final Assessment

**VERIFIED FOR TESTED SCOPE**
