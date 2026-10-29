# DEAD CODE AUDIT REPORT — 2026-10-29 (FULL AUDIT RUN)

## 1. Summary

- **Project:** Acorn — Local Vault Financial Desktop Application
- **Stack:** Electron 44.3.0, React 19.3.0, TypeScript 7.0.2, Vite 8.3.0, SCSS
- **Scope:** Lane 3 of FULL Launch Audit (`DEAD-CODE`). Detection and verification of dead files, unused exports, orphaned assets, unreferenced dependencies, and duplicate utilities.
- **Auditor Mode:** Read-only analysis.
- **Findings:** 0 new dead code issues introduced. All 408 tests pass cleanly. All exports and modules across `src/components/assistant/` and `src/lib/assistant/` are actively consumed or covered by unit tests.

---

## 2. Findings Table

| ID | Verdict | Category | Location | Status | Action / Decision |
|---|---|---|---|---|---|
| `DEAD-01` | `SAFE` | Unused / Duplicate File | `src/components/ui/ConfirmModal.tsx` | `PASS` | Removed in earlier audit; unified to `Modal.tsx` |
| `DEAD-02` | `SAFE` | Commented Code | `src/pages/Transactions/Transactions.tsx` | `PASS` | Removed in earlier audit |
| `DEAD-03` | `SAFE` | Duplicate Utilities | `src/utils/chartTheme.ts` | `PASS` | Re-exported canonical utilities from `src/utils/chart.ts` |
| `DEAD-04` | `SAFE` | Unused Export | `src/data/countryCurrency.ts` | `PASS` | Removed in earlier audit |
| `DEAD-05` | `SAFE` | Superseded Utility | `src/utils/chart.ts` | `PASS` | Removed in earlier audit |
| `DEAD-06` | `LIKELY SAFE` | Uncompressed OCR model in root | `eng.traineddata` (23.4 MB) | `KEEP` | Standalone uncompressed training data; runtime uses `resources/ocr/eng.traineddata.gz` |

---

## 3. Verification Table

| Check | Command or method | Status | Evidence |
|---|---|---|---|
| Build | `npm run build` | `PASS` | Vite client bundle + Electron main process compiled successfully in 1.06s |
| Typecheck | `npm run typecheck` | `PASS` | 0 errors across main and renderer TypeScript configs |
| Lint | `npm run lint` | `PASS` | 0 errors |
| Unit tests | `npm test` | `PASS` | 408/408 tests passed across 29 test files |
| Dependency tree valid | `package.json` | `PASS` | Zero broken references; all production dependencies actively used |
| Assistant Module Exports | AST reference audit | `PASS (code only)` | All exports in `src/components/assistant/` and `src/lib/assistant/` referenced |

---

## 4. Kept List (Justified Retentions)

| Candidate / Category | Location | Reason to Keep |
|---|---|---|
| `eng.traineddata` | Repository root | Kept to avoid destructive repository deletions during read-only audit. |
| `resources/ocr/eng.traineddata.gz` | `resources/ocr/` | Production OCR model bundled by `electron-builder.config.js`. |
| All dependencies in `package.json` | `package.json` | Every dependency (`better-sqlite3`, `exceljs`, `papaparse`, `pdfjs-dist`, `recharts`, `tesseract.js`) actively powers core workflows. |

---

## 5. Next Actions

Proceed to Lane 4: `SECURITY` audit.

---

## 6. Assessment

**VERIFIED FOR TESTED SCOPE**
