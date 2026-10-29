# 05 — AUDIT

> **How to use — one line:**
> `Read AI-Build-Workflow/05-AUDIT.md and apply it to this project.`
> The AI runs the blocks in order and stops at each gate. You only answer
> questions. No file access? Paste this whole file instead. Want manual control?
> Paste one block at a time.

**Run mode:** LAUNCH · **Produces:** read-only audit report + verdict · **Gate:** you
read the report and approve fixes. Nothing is edited before that.

This stage exists because the person who built the thing cannot see the thing.
The audit reads the whole project as an attacker, a new user, an accountant, and
a lawyer would, and reports what it finds with evidence.

Read-only means read-only. No edits, no commands, no API calls, no installs.
Mixed audit-and-fix produces a report you cannot trust, because you never know
what was inspected versus changed.

Full checklist detail lives in `_reference/MASTER_LAUNCH_AUDIT_COMBINED.md`
(sections S1–S23, site-type modules, stack checks, policy templates). This file
is the workflow, the decision rules, and the report.

---

## USE WHEN

- Before real users see it.
- After a large feature lands.
- You inherited a project and need to know what you are standing on.
- Something feels wrong but you cannot name it.

---

## SHORTCUTS

Add one shortcut word after the prompt. Default is `audit only`.

| Shortcut | What it does |
|---|---|
| `audit only` | Phases 1–4. Read-only. Never edits, even if asked later in the run. |
| `security only` | Only the security sections: S1–S11, S14–S15, S21–S23. |
| `cost only` | Only paid APIs, spend caps, loops, and worst-case billing. |
| `forms only` | Only forms: consent, labels, errors, validation, data minimisation. |
| `tracking only` | Trackers, cookies, third parties, consent by region. |
| `policies only` | Draft privacy, cookie, terms, refund, accessibility from the appendix. Mark every legal claim `[VERIFY]`. |
| `fast` | Verdict, top five fixes, launch checklist. No drafts. |
| `re-audit` | Compare against the last report: resolved, regressed, still open. If no saved report exists, say so, run a normal audit, and label nothing as resolved or regressed. |
| `fix approved` | Implement only the named finding IDs. Default after a report. |
| `fix everything` | After approval, implement all non-destructive fixes in one pass instead of naming each ID. It never skips the Phase 4 stop. Still excludes data loss, production changes, secret rotation, paid services, and external spend. |

---

## BLOCK 1 — The audit

```
Read _reference/MASTER_LAUNCH_AUDIT_COMBINED.md and apply it to this project.

ROLE
You are a senior QA engineer, security reviewer, cost-safety engineer, and
pre-launch compliance reviewer (legal, privacy, accessibility, UX, SEO, trust).
Be a strict inspector, not a cheerleader. Direct, specific, ordered by risk.

SHORTCUT: <audit only | security only | cost only | fast | re-audit | ...>

SHORTCUT RULES
1. Phases 1-4 are READ-ONLY. Do not run the app, tests, builds, linters,
   scanners, or migrations. Do not install anything. Do not call any API, URL,
   database, or network service. Do not create, edit, rename, or delete files.
   Reading is the only action.
2. STOP after Phase 4. Ask for approval before changing anything.
3. Phase 5+ only: small reviewable changes, app working at every step.
4. Commands run only in Phase 6, only with approval. Otherwise list exact
   commands for me to run.
5. Never hardcode a secret while fixing. Move it to an environment variable.
6. Never add trackers, scripts, or third-party services the project did not
   already use.

HONESTY RULES
7. Every finding needs a location: path:line, or page/element/URL, plus a short
   snippet. No evidence means it is not a finding.
8. Never invent files, lines, functions, settings, vulnerabilities, laws, prices,
   or business facts. Unknown means [placeholder] or a question.
9. If it cannot be confirmed by reading, mark NEEDS-PROOF and say exactly how to
   test it.
10. Do not trust comments, README claims, or names. A function called
    validateInput proves nothing.
11. "I found nothing" is not "it works". Use NOT VERIFIED where you did not
    trace it.
12. Mask secrets as sk_l****. Never print a full key.
13. Be honest about coverage. List every file or folder not read and why.
14. No padding. No "improve security". Skip what does not apply in one line.
15. You are not a lawyer. Mark legal items [VERIFY] and separate required from
    recommended.
16. Ask at most three questions, then continue with stated assumptions and
    TODOs.
17. Never write "ready to launch", "safe", "production-ready", or "good to go".
18. Plain language. Explain any jargon.

PHASE 1 — DISCOVER (read-only)
1. File inventory. List every file and folder, ignoring only node_modules, .git
   internals, build output, and lockfile contents. Count them. Track read vs not
   read. Read these first: manifests and lockfile names; all .env and config;
   schema, migrations, and RLS policies; routing and entry points; auth,
   middleware, payment, and paid-API code; deployment and CI; public pages,
   templates, forms, scripts, assets.
2. Project map. Fill from code; ask only what cannot be detected: purpose;
   product type and site type; stack, database, auth provider, payment provider,
   hosting; paid providers, expected users per day, monthly budget; business
   location and customer regions; forms, trackers, third parties; sensitive data.
3. Applicability. List every section, module, and stack check that applies or is
   skipped, one line each with a reason.
4. Asset, data, and paid-call inventory. Assets: accounts, personal data,
   financial data, records, uploads, keys, payment tokens, source, admin
   accounts. For each: where it lives and who should access it. Sensitive data
   types: where stored, who reads, encrypted, logged, sent to whom. Every
   tracker, pixel, cookie, SDK, embed: what it collects, where it goes, consent
   needed. Every external or paid API call: file:line, trigger, frequency,
   model/tier, client or server.
5. Threat model. For each component: what data enters, can an attacker control
   it, what permissions does it have, what secrets live there, can the UI be
   bypassed to hit the backend directly, what happens if it is compromised.
6. Feature, role, and flow map. Every route, every role, every end-to-end flow.

PHASE 2 — AUDIT (read-only)
1. Trace every flow in code, UI -> API -> backend -> data -> response -> UI, on
   three paths: happy, failure (bad input, server error, expired session, no
   data), abuse (another user's ID, skipped steps, repeated requests, direct URL,
   tampered values). Note every broken link in the chain.
2. Apply every applicable section of the checklist, plus site-type modules and
   stack checks. Status per section: PASS / FAIL / BLOCKED / NOT RUN / N/A, with
   PASS marked "(code only)" when it comes from reading.

PHASE 3 — SELF-VERIFY (mandatory)
Re-open every finding and confirm: the file and line are real; the code really
behaves as described; no middleware, database policy, framework default, or
provider setting already prevents it; the severity is right; it is not a
duplicate. Remove or downgrade what you cannot confirm. Then ask yourself what
you did not check and what you assumed, and add it to Coverage or NEEDS-PROOF.

PHASE 4 — REPORT, THEN STOP
Deliver the report in the format below. Do not save drafts, do not edit files,
do not run commands. Then ask for approval.
```

---

## APPLICABILITY MATRIX

**Always apply, every project:** S1 Auth, S2 Authorization, S3 Input, S7 Secrets,
S13 Dependencies, S20 Logging and Monitoring, S21 Backups and Incident Response,
S22 Deployment, S23 Release Gate. Plus S12 Cost if any paid API exists.

| Project type | Also apply | Skip |
|---|---|---|
| Website / web app | S4–S6, S8, S9-cloud, S10, S15–S19, site modules | S14 |
| API-only backend | S4–S6, S8 (CORS/cookies), S9, S10 | S15–S16, S19 if no HTML; S14 |
| Desktop app | S14; S4–S6 if it embeds a web UI | S8 headers unless it calls a web API |
| Desktop + local DB | S14, S9-local, S3 for local data too | S9-cloud, S8 |
| Desktop + cloud backend | S14, S9-cloud, S4–S6, S10 | S9-local unless it caches |
| Mobile app | Stack check X5, S9, S14-equivalent sandboxing, S16 | S8 headers unless it renders web |
| Cloud database | S9-cloud in full | — |
| Local database | S9-local in full | — |
| Both (cache + cloud) | S9 both; state what is cached vs authoritative | — |
| User-facing, any platform | S17, S18 | — |
| Payments present | S11 | — |

Mixed projects take the union of every matching row.

## THE CHECKLIST, AT A GLANCE

Detail and per-item checks: `_reference/MASTER_LAUNCH_AUDIT_COMBINED.md` §5.

| Section | Covers |
|---|---|
| S1 | Authentication: flows, sessions, password storage, reset, MFA |
| S2 | Authorization: server-side checks, ownership, IDOR, tenant boundaries, mass assignment |
| S3 | Input: schema validation, injection, XSS, CSRF, size limits |
| S4 | File uploads: type, size, storage path, access control, traversal |
| S5 | Backend and API: contracts, status codes, error shapes, timeouts, idempotency |
| S6 | Rate limiting and abuse: auth, upload, search, expensive routes |
| S7 | Secrets and config: exposure, env separation, debug settings |
| S8 | Transport, headers, CORS, cookies: HTTPS, CSP, HSTS, SameSite |
| S9 | Database: least privilege, migrations, transactions, indexes, backups, retention |
| S10 | Performance and load: N+1, unbounded queries, concurrency |
| S11 | Payments: idempotency, webhooks, replay, amount tampering |
| S12 | Paid APIs and cost: loops, retries, caps, alerts, kill switch, worst-case bill |
| S13 | Dependencies: advisories, maintenance, licence, lockfiles |
| S14 | Desktop: IPC exposure, filesystem scope, updates, installer permissions |
| S15 | Frontend quality: routing, states, dead buttons, features with no backend |
| S16 | Responsive and accessibility: WCAG 2.2 AA target, keyboard, contrast, focus |
| S17 | Sensitive data and privacy: inventory, minimisation, retention, access |
| S18 | Legal, consent, tracking: notices, cookies, disclosures, `[VERIFY]` items |
| S19 | SEO and content: metadata, canonicals, sitemaps, broken links |
| S20 | Logging, monitoring, alerting: signal without personal data |
| S21 | Backups, DR, incident response: restore tested, roles named |
| S22 | Deployment and publishing: envs, secrets in CI, rollback, DNS, certificates |
| S23 | Release gate: the final go/no-go list |

---

## REPORT FORMAT (Phase 4)

Deliver in chat, in this order:

1. **Summary:** stack, purpose, roles, main flows, sections applied or skipped
   with one line each.
2. **Coverage:** total files N, read N, not read and why, sections N/A and why,
   assumptions made.
3. **Verdict** with counts: CRITICAL _ HIGH _ MEDIUM _ LOW _ NEEDS-PROOF _.
4. **CRITICAL and HIGH findings** in the full finding shape from
   `00-RULES.md` (ID, severity, confidence, effort, location, problem, evidence,
   impact, fix).
5. **MEDIUM and LOW findings:** same shape, shorter.
6. **NEEDS-PROOF items:** each with the exact way to test it.
7. **Checklist table:** section | status | finding IDs.
8. **Flow results:** each flow as works end to end / broken at `<location>` /
   not verified.
9. **Inventory:** assets and sensitive data; trackers (data -> destination ->
   consent needed); paid calls (file:line, trigger, frequency, client or server,
   risk flags).
10. **Legal map `[VERIFY]`:** by region, required vs recommended.
11. **Top five fixes,** then the full ordered fix list with IDs.
12. **Drafts where useful:** consent text, banner copy, policy outline, label and
    error copy. Not saved to disk yet.
13. **Approval request.**

**Verdict, exactly one:**

- `NOT READY` — one or more CRITICAL or HIGH findings. State the counts.
- `NOT FULLY VERIFIED` — no CRITICAL or HIGH found, but runtime tests or
  `[VERIFY]` legal items remain open.

Runtime evidence, when you need it, comes from the E2E suite in `07-UPKEEP.md`
block 1. An audit that only read code cannot produce runtime evidence, and must
say so.

Never write "READY". Only a human fills the sign-off in `06-SHIP.md`.

---

## IT'S DONE WHEN

- Coverage numbers are stated, with the unread list.
- Every finding has a real location and was re-checked in Phase 3.
- Applicability is explicit: every section is applied, skipped with a reason, or
  N/A.
- The verdict is one of the two allowed strings.
- No file was edited and no command was run.

## GATE

Use this shape exactly, then stop:

```
GATE — AUDIT
Done:      read-only audit complete, verdict <NOT READY | NOT FULLY VERIFIED>
Evidence:  coverage <read>/<total> files; findings CRITICAL _ HIGH _ MEDIUM _ LOW _ NEEDS-PROOF _
I need:    which finding IDs to fix, or none
Reply:     fix <IDs>   |   fix everything   |   stop
```

After I approve fixes, continue to `06-SHIP.md`. Destructive data changes,
production changes, secret rotation, paid services, and external costs still
need separate explicit authorization. You never fill the release status or the
sign-off.

## COMMON FAILURES

- **Auditing your own feature.** The report is clean because the reviewer shares
  the builder's blind spot. Use a fresh session, no build context.
- **Editing during the audit.** It destroys the coverage claim. Read-only first.
- **Findings without locations.** "Some endpoints may lack authorization" is
  unusable. Which endpoint, which line?
- **Reporting tools instead of problems.** A dependency count is not a finding.
  An exploitable advisory in a package you actually import is.
- **Trusting the agent's confidence.** Phase 3 exists because the first pass is
  wrong about 20% of the time. Re-checking is not optional.
- **Skipping cost.** The most common launch surprise is a bill, not a breach.
- **Saying "ready".** The audit can only say what is still broken or unverified.
  Go/no-go is a human decision with a name attached.
