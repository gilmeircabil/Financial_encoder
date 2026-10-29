# SECURITY AUDIT REPORT — 2026-10-29 (FULL AUDIT RUN)

## 1. Summary

- **Project:** Acorn — Local Vault Financial Desktop Application
- **Stack:** Electron 44.3.0, React 19.3.0, TypeScript 7.0.2, SQLite (better-sqlite3 13.0.3)
- **Profile:** 100% Offline Local Desktop Vault (Zero External Network Dependencies, Zero Telemetry)
- **Scope:** Lane 4 of FULL Launch Audit (`SECURITY`). Evaluation against Sections S1–S11, S14–S15, S21–S23 of `MASTER_LAUNCH_AUDIT_COMBINED.md`.
- **Mode:** Read-only analysis.
- **Verification:** 16/16 automated security and parameter validation tests pass; full test suite (408 tests) clean.

---

## 2. Findings Register

| ID | Severity | Category | Location | Summary & Proof | Recommendation / Status |
|---|---|---|---|---|---|
| `SEC-01` | `LOW` | Storage / Data at Rest | `%APPDATA%\Acorn\database.db` | Database and `.febak` backups are stored unencrypted on disk under the Windows user profile. Protection relies on OS user permissions and BitLocker. | **ACCEPTED RISK**: Documented in `SECURITY.md`. Recommend BitLocker full-disk encryption. |
| `SEC-02` | `LOW` | Output Encoding | `electron/export/report.service.ts:130` | `escapeHtml()` encodes `&`, `<`, `>`, `"`, but omits single-quote (`'`). While interpolated values are within `<td>` text nodes, attribute contexts should be safeguarded. | **OPEN**: Add `.replace(/'/g, '&#39;')` to `escapeHtml()`. |
| `SEC-03` | `INFO` | Dependency Advisory | `package.json:10-12` | Transitive `uuid` advisory (GHSA-w5hq-g745-h8pq) resolved via `"overrides": { "uuid": ">=11.1.1" }`. | **PASS**: Overrides active and verified. |
| `SEC-04` | `PASS` | IPC & Renderer Hardening | `electron/main.ts:89-92` | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, all child windows denied via `setWindowOpenHandler`. | **PASS**: Isolation strictly enforced. |
| `SEC-05` | `PASS` | SQL Injection Defense | `electron/transactions/transaction.service.ts` | 100% prepared statements with parameterized inputs. Dynamic sort uses strict allowlist dictionary (`COLUMN_MAP`). | **PASS**: Zero dynamic SQL concatenation. |
| `SEC-06` | `PASS` | Path Traversal Protection | `electron/import/import.service.ts:41` | `pickedImportPaths` allowlist ensures main process only reads files selected via native OS dialog or drop. | **PASS**: Arbitrary path injection blocked. |
| `SEC-07` | `PASS` | Secrets Leakage Defense | Repository and Git tree | Git audit confirms zero committed private keys, certificates, or tokens. `.gitignore` covers `.env*`, `.pfx`, `.db`, `.febak`. | **PASS**: Clean repository hygiene. |
| `SEC-08` | `PASS` | Disaster Recovery & Backup | `electron/database/backup.service.ts` | Automated startup backups, 30-day retention, pre-destruction safety snapshots before restore/reset. | **PASS**: Robust backup architecture. |
| `SEC-09` | `PASS` | Local AI Assistant Isolation | `src/lib/assistant/assistantEngine.ts` | Zero network requests, 0 telemetry. All natural language queries route through predefined, parameterized read-only IPC handlers. | **PASS**: Zero direct SQL execution by AI. |

---

## 3. Security Checks Table

| Check | Method | Status | Evidence |
|---|---|---|---|
| Electron Context Isolation | Static Code Audit | `PASS` | `contextIsolation: true` in `electron/main.ts:89` |
| Node Integration Disabled | Static Code Audit | `PASS` | `nodeIntegration: false` in `electron/main.ts:90` |
| Sandbox Enabled | Static Code Audit | `PASS` | `sandbox: true` in `electron/main.ts:91` |
| WebSecurity Enabled | Static Code Audit | `PASS` | `webSecurity: true` in `electron/main.ts:92` |
| Child Windows Blocked | Static Code Audit | `PASS` | `setWindowOpenHandler(() => ({ action: 'deny' }))` |
| SQL Injection Validation Suite | Automated Tests | `PASS` | 16/16 tests pass in `tests/security/validation.test.ts` |
| File Import Path Allowlist | Static Code Audit | `PASS` | Only `pickedImportPaths` permitted |
| Git Secrets & Token Scan | Git History Audit | `PASS` | 0 secrets, 0 API tokens found in tracked files or commit log |
| AI Prompt Injection / SQL Escape | Static Code Audit | `PASS` | Assistant queries use structured API calls; cannot execute raw SQL |

---

## 4. Remaining Problems

- `SEC-02`: Single-quote escaping omission in `electron/export/report.service.ts` (`LOW`).

---

## 5. Next Actions

Proceed to Lane 5: `POLICY` audit.

---

## 6. Assessment

**VERIFIED FOR TESTED SCOPE**
