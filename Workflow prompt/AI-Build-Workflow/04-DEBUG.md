# 04 — DEBUG

> **How to use — one line:**
> `Read AI-Build-Workflow/04-DEBUG.md and apply it to this project.`
> The AI runs the blocks in order and stops at each gate. You only answer
> questions. No file access? Paste this whole file instead. Want manual control?
> Paste one block at a time.

**Run mode:** FIX · **Produces:** root cause, minimal fix, regression test, evidence
table · **Gate:** the failing test fails before the fix and passes after.

Two entry points:

- **Block 1** for one error, right now. Five minutes.
- **Block 2** for a full error sweep before launch, or when the app "mostly
  works" but you do not trust it.

Both obey the same rule: no fix without a cause, no claim without evidence.

For a full end-to-end test suite (the net that catches future regressions), see
`07-UPKEEP.md` block 1. This stage locks a single fix with one regression test.

---

## USE WHEN

- An error appears. Any error.
- The app behaves correctly in one place and not another, and you cannot say why.
- Before launch, when nobody has systematically looked for runtime problems.
- After a refactor, when something "should" still work.

---

## BLOCK 1 — One error, fast

```
Debug this error. Do not guess. Do not change code until you can explain the
cause.

Error: <paste the full message and stack trace, not a summary>
When it happens: <exact steps>
Expected: <what should happen>
Actual: <what happens>
MODE: <prototype | staging | production>

1. Read the stack trace. Open the exact files and lines involved. List them.
2. State expected vs actual in one line.
3. Give three hypotheses, ranked by likelihood, each with a reason.
4. Prove or kill each one using logs, a breakpoint, or a tiny throwaway test.
   Evidence, not plausibility. Say which hypothesis survived.
5. Fix the root cause. Not the symptom, not the caller, not the error message.
6. Search the repo for the same pattern. If it breaks here, where else does it
   break? List those locations.
7. Add a regression test that fails without the fix and passes with it. Show
   both results.
8. Run typecheck, lint, and the affected tests. Report each with a status.
9. Tell me in two lines why it broke, and why it cannot silently break this way
   again.

If the cause is not confirmed after step 4, stop and report the evidence plus
the next diagnostic step. Do not apply a speculative fix.
```

## BLOCK 2 — Full error sweep

```
Act as a senior engineer, QA engineer, and security reviewer. Systematically
find, confirm, and fix errors in this existing project. Do not stop at a list of
problems. Fix what is confirmed and safe. Stop for approval before anything
destructive.

MODE: <prototype | staging | production>

NON-NEGOTIABLE RULES
1. Inspect before modifying. Detect the stack from the project; never assume it.
2. Never rewrite a project to fix a small problem.
3. Never change unrelated features, routes, schemas, or UI while debugging.
4. Never claim a command, test, build, or fix succeeded unless you ran it and saw
   the result.
5. Never hide an error by disabling lint, removing a test, catching and ignoring,
   or loosening type settings.
6. Never print a secret. Mask as sk_l****.
7. Never delete data, reset a database, or run a destructive migration without
   explicit approval.
8. Preserve existing behaviour and compatibility.
9. If a dependency, credential, or service is missing, say so. Do not invent a
   successful result.
10. Separate confirmed bugs from suspected risks and from optional improvements.

PHASE 1 — DISCOVERY
Detect and report: languages and frameworks; frontend and backend structure;
entry points and startup; package manager and manifests; available scripts for
build, test, lint, typecheck; routes and API surface; database, schema, models,
migrations; auth and authorization; environment variables required; uploads and
storage; external integrations; deployment, Docker, CI; existing tests and
coverage; known TODOs and failing checks.
Do not assume every project has a frontend, a backend, a database, or tests.

PHASE 2 — BASELINE (before any change)
1. git status. Identify and preserve existing uncommitted work.
2. Read the real scripts from the manifests. Do not invent commands.
3. Run the safe diagnostics: install integrity, lint, typecheck, unit,
   integration, production build, app startup, API smoke, DB connectivity and
   migration status, browser console and network.
4. Record actual output and exit code for each.
5. Separate pre-existing failures from new ones.
6. If something fails, keep the original error text.
Report a baseline table: check | command | status | evidence.
Allowed statuses: PASS | FAIL | BLOCKED | NOT RUN | N/A.

PHASE 3 — SYSTEMATIC AUDIT
Cover only what applies, and say when a category does not apply.
A. Build: syntax, types, missing modules, bad exports, config, dependency
   conflicts, env mismatch, production-only failures, case-sensitive paths,
   unsupported versions.
B. Frontend: runtime exceptions, blank screens, routing, state updates, hook and
   lifecycle errors, unhandled rejections, form validation, loading and infinite
   loading, empty and error states, responsive regressions, dead links, broken
   buttons, accessibility, failed assets and requests, hydration errors.
C. Backend: startup failures, unhandled exceptions, wrong status codes, wrong
   request/response shapes, missing validation, error handling, auth failures,
   pagination/filter/sort bugs, races and transactions, CORS, rate limits and
   request sizes, timeouts, sensitive data in logs.
D. Data: connection failures, wrong queries, missing or inconsistent migrations,
   bad relationships and foreign keys, missing indexes, duplicates, nulls and
   invalid values, transaction and rollback behaviour, unintended mutation,
   pagination performance, unsafe schema changes.
E. Auth: login/logout, session handling, expiry, missing permission checks,
   privilege escalation, cross-user access, reset and recovery, invalidation,
   cookie and token configuration, server-side enforcement.
F. Security: hardcoded or exposed secrets, injection, XSS, CSRF where
   applicable, broken access control, unsafe uploads, path traversal, IDOR,
   unsafe deserialization, missing rate limits, vulnerable dependencies,
   permissive CORS and headers, debug settings in production, sensitive data in
   logs or errors.
G. Production readiness: missing env vars, wrong build/start commands, port
   binding, database connectivity in the deployed environment, missing
   migrations, asset paths, HTTPS and secure cookies, health checks, logging and
   monitoring, graceful shutdown, dev-vs-prod config, filesystem limits, backup
   and recovery.
H. Performance: extra queries, N+1, memory leaks, unbounded loops, inefficient
   rendering, excessive requests, missing pagination, unbounded uploads, missing
   timeouts, retry loops, unclean resources.
Prioritise reproducible issues over speculative optimisation.

PHASE 4 — ROOT CAUSE
For each confirmed error: reproduce it safely; record the exact message and
steps; identify the first meaningful frame; trace through the code; state the
underlying cause; check whether other routes, components, or flows share it;
state whether it pre-existed; define expected behaviour and the test that proves
it.
If the cause is uncertain, label it a hypothesis and gather evidence before any
risky change.

PHASE 5 — SEVERITY
Use exactly these levels:
CRITICAL  data loss, auth bypass, exposed secret, payment error, unbounded cost,
          unusable app. Fix now.
HIGH      core flow broken, serious permission gap, likely crash. Fix before
          release.
MEDIUM    noticeable bug, workaround exists. Fix before launch.
LOW       polish and edge cases. Fix when appropriate.
NEEDS-PROOF  cannot be decided by reading; must be run or checked.
Justify each rating in one line. If torn, choose the higher level.

PHASE 6 — FIX
1. Highest confirmed severity first.
2. Smallest change that addresses the cause.
3. Follow existing architecture and conventions.
4. Add or update a regression test where practical.
5. Preserve API contracts and data compatibility.
6. Errors handled explicitly, with sensible user-facing feedback.
7. No stack traces, credentials, or internals to users.
8. No broad catch that swallows failures.
9. No unrelated refactoring.
10. Inspect the final diff before reporting.
11. Stop and ask before destructive migrations, production changes, paid
    services, or architecture changes.
12. If a fix cannot be done safely, explain the blocker and the next safe action.
For each fix record: original behaviour, cause, files, what changed and why,
side effects, test added.

PHASE 7 — VERIFY
Re-run the relevant checks: reproduce the original failure, run the covering
test, typecheck, lint, unit and integration tests, production build, start the
app, exercise the affected routes and flows, read the logs, check neighbouring
features, review the diff.
Compare against the Phase 2 baseline. If a check fails, say whether it is caused
by the fix, pre-existing, or environmental.
Never edit a test to get green unless the test itself is wrong, and justify it.
A passing build does not prove the feature works.

PHASE 8 — REPORT
1. Summary: project, stack, what was found, what was fixed, what remains,
   verification limits.
2. Findings table: ID | severity | issue | cause | status.
3. Files changed, each with the reason.
4. Checks table: check | result | evidence. Mark unrun checks explicitly.
5. Remaining problems: unresolved bugs, suspected issues, blocked checks,
   required approvals. Never mark an open issue as fixed.
6. Next actions, most important first.
7. Final assessment: VERIFIED FOR TESTED SCOPE, PARTIALLY VERIFIED, or NOT
   VERIFIED.
Never say the project is error-free or secure.

EXECUTE
Start at Phase 1. Go in order. You may inspect, run safe diagnostics, edit
source, add regression tests, and re-verify. Do not stop at a list if safe fixes
are possible. Stop for approval before destructive, irreversible, or
production-affecting actions.
```

---

## THE PHASES AND WHY EACH EXISTS

| Phase | Why it exists | What goes wrong without it |
|---|---|---|
| 1 Discovery | Detect, never assume | Wrong framework fixes, invented commands |
| 2 Baseline | Separate old breakage from new | You get blamed for bugs that predate you, or you "fix" into a worse state |
| 3 Sweep | Look where nobody looked | The bug you fix is one of five with the same cause |
| 4 Root cause | Explain before editing | Symptom patches that regenerate |
| 5 Severity | Order the work | Effort spent on polish while a leak is open |
| 6 Fix | Small and reversible | A debugging session becomes a refactor |
| 7 Verify | Evidence | "Fixed" that is not fixed |
| 8 Report | Handoff | Nobody knows what remains open |

---

## IT'S DONE WHEN

- Every fixed issue has a cause, not just a diff.
- A regression test exists that fails on the old code and passes on the new.
- The same pattern was searched for elsewhere, and the results are listed.
- The checks table is complete, with real statuses.
- Remaining problems are listed, not implied fixed.
- The final assessment is one of the three allowed verdicts.

## GATE

```
GATE — DEBUG
Done:      <n> fixed, <n> open; CRITICAL _ HIGH _ MEDIUM _ LOW _ NEEDS-PROOF _
Evidence:  regression test `<name>` fails before and passes after; checks table
I need:    re-run the sweep, go to the audit, or stop here
Reply:     again   |   audit   |   stop
```

## COMMON FAILURES

- **Fixing the symptom.** A null check that stops the crash while the real cause
  keeps writing bad data.
- **No baseline.** Without one, you cannot tell whether your fix broke something
  or it was already broken.
- **One hypothesis, no test.** The agent "knows" the answer. Usually it does not.
- **Green by deletion.** A failing test removed, a lint rule disabled, a catch
  block added. The bug is still there, now invisible.
- **Fixing everything at once.** Three changes, one verification. If it fails,
  you cannot tell which one.
- **Declaring victory after a build.** Compilation is not behaviour.
