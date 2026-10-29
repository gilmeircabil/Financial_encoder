# DEBUG — find, prove, and fix errors in an existing project

> **How to use — one line:**
> `Read AI-EXISTING-PROJECT/DEBUG.md and apply it to this project.`
> The AI runs the phases in order and stops at each gate. No file access? Paste
> this whole file instead.

You are debugging a project you did not write. Nothing is assumed: not the
framework, not the package manager, not the database, not the scripts. You detect
everything from the files on disk.

---

## RULES

1. Inspect before modifying. Detect the stack; never assume it.
2. Never rewrite a project to fix a small problem.
3. Never change unrelated features, routes, schemas, or UI while debugging.
4. Never claim a command, test, build, or fix succeeded unless you ran it and saw
   the result.
5. Never hide an error by disabling lint, removing a test, catching and ignoring,
   or loosening type settings.
6. Never print a secret. Mask as `sk_l****`.
7. Never delete data, reset a database, or run a destructive migration without
   explicit approval.
8. Preserve existing behaviour and compatibility.
9. If a dependency, credential, or service is missing, say so. Do not invent a
   successful result.
10. Separate confirmed bugs from suspected risks and from optional improvements.
11. Do not install, upgrade, or remove dependencies without a one-line
    justification and my approval.
12. If the working tree has uncommitted changes, preserve them. Do not revert
    work that is not yours.

---

## PHASE 1 — DISCOVERY

Detect and report:

- Languages, frameworks, and their versions, from the manifests.
- Frontend and backend structure; entry points; how the app starts.
- Package manager and lockfile. Use the real one.
- Available scripts: build, test, lint, typecheck. If a script does not exist,
  write "none". Never invent a command.
- Routes and API surface.
- Database, schema, migrations, and how they run.
- Authentication and authorization mechanism.
- Required environment variables, from code and `.env*` files.
- Uploads and storage.
- External and paid services.
- Deployment, Docker, CI.
- Existing tests and what they cover.
- TODOs, known failures, and error logs.

Do not assume the project has a frontend, a backend, a database, or tests.

**Output:** a short project overview, plus the list of checks you can and cannot
perform in this environment.

## PHASE 2 — BASELINE

Before changing anything:

1. `git status`. Identify and preserve uncommitted work.
2. Read the real scripts. Run only what exists.
3. Run the safe diagnostics: dependency integrity, lint, typecheck, unit,
   integration, production build, app startup, API smoke, database connectivity
   and migration status, browser console and network.
4. Capture the actual output and exit code for each.
5. Separate pre-existing failures from new ones.
6. Keep the original error text. Do not paraphrase it.

Do not run conflicting commands at the same time. Do not run database-dependent
tests without understanding their environment.

**Output:** a baseline table: check | command | status | evidence.

Statuses, only these: `PASS` · `FAIL` · `BLOCKED` · `NOT RUN` · `N/A`.
Add `(code only)` when you only read code.

## PHASE 3 — SYSTEMATIC AUDIT

Cover what applies. Say when a category does not apply, in one line.

**A. Build.** Syntax, types, missing modules, bad exports, invalid config,
dependency conflicts, env mismatch, production-only failures, case-sensitive
paths, unsupported versions.

**B. Frontend.** Runtime exceptions, blank screens, routing, state updates, hook
and lifecycle errors, unhandled promise rejections, form validation, loading and
infinite loading, empty and error states, responsive regressions, dead links,
buttons with no handler, accessibility, failed assets and requests, hydration
errors.

**C. Backend.** Startup failures, unhandled exceptions, wrong status codes, wrong
request or response shapes, missing validation, error handling, auth failures,
pagination and filtering, races and transactions, CORS, rate limits and request
sizes, timeouts, sensitive data in logs.

**D. Data.** Connection failures, wrong queries, missing or inconsistent
migrations, bad relationships and foreign keys, missing indexes, duplicates,
nulls and invalid values, transaction and rollback behaviour, unintended
mutation, pagination performance, unsafe schema changes.

**E. Auth.** Login and logout, session handling, expiry, missing permission
checks, privilege escalation, cross-user access, password reset, invalidation,
cookie and token configuration, server-side enforcement. Verify access control on
the server, not only in the UI.

**F. Security.** Hardcoded or exposed secrets, injection, XSS, CSRF where
applicable, broken access control, unsafe uploads, path traversal, IDOR, unsafe
deserialization, missing rate limits, vulnerable dependencies, permissive CORS
and headers, debug settings in production, sensitive data in logs or error
responses. Use safe, authorised checks only.

**G. Production readiness.** Missing env vars, wrong build or start commands,
port binding, database connectivity in the deployed environment, missing
migrations, asset paths, HTTPS and secure cookies, health checks, logging and
monitoring, graceful shutdown, dev versus prod configuration, filesystem limits,
backup and recovery.

**H. Performance.** Extra queries, N+1, memory leaks, unbounded loops,
inefficient rendering, excessive requests, missing pagination, unbounded
uploads, missing timeouts, retry loops, unreleased resources. Prefer measured
bottlenecks over speculative optimisation.

## PHASE 4 — ROOT CAUSE

For each confirmed error:

1. Reproduce it, using the safest method available.
2. Record the exact message and the reproduction steps.
3. Identify the first meaningful frame or failing operation.
4. Trace it through the code and dependencies.
5. State the underlying cause, not the visible symptom.
6. Check whether other routes, components, or flows share the cause.
7. Say whether it existed before this session.
8. Define expected behaviour and the test that would prove it.

If the cause is not confirmed, label it a hypothesis and gather more evidence
before any risky change.

## PHASE 5 — SEVERITY

Use exactly these levels:

| Level | Meaning |
|---|---|
| `CRITICAL` | Data loss, auth bypass, exposed secret, payment error, unbounded cost, unusable app. Fix now. |
| `HIGH` | Core flow broken, serious permission gap, likely crash. Fix before release. |
| `MEDIUM` | Noticeable bug, workaround exists. Fix before launch. |
| `LOW` | Polish and edge cases. Fix when appropriate. |
| `NEEDS-PROOF` | Cannot be decided by reading. Must be run or checked. |

Justify each in one line. If torn, pick the higher level and say why.

## PHASE 6 — FIX

If no finding IDs have been approved yet, fix nothing. Go to Phase 8, write the
report, and print the gate.

1. Highest confirmed severity first.
2. Smallest change that removes the cause.
3. Follow the project's existing architecture and conventions.
4. Add or update a regression test where practical.
5. Preserve API contracts and data compatibility.
6. Handle errors explicitly, with useful user-facing feedback.
7. No stack traces, credentials, or internals to users.
8. No broad catch that swallows failures.
9. No unrelated refactoring.
10. Inspect the final diff before reporting.
11. Stop and ask before destructive migrations, production changes, paid
    services, or architecture changes.
12. If a fix cannot be done safely, explain the blocker and the next safe action.

For each fix record: original behaviour, cause, files, what changed and why, side
effects, test added.

## PHASE 7 — VERIFY

Re-run the relevant checks: reproduce the original failure, run the covering test,
typecheck, lint, unit and integration tests, production build, start the app,
exercise the affected routes and flows, read the logs, check neighbouring
features, review the diff.

Compare against the Phase 2 baseline. If a check fails, say whether it is caused
by the fix, pre-existing, or environmental.

Never edit a test to get green unless the test itself is wrong, and justify it. A
passing build does not prove the feature works.

If a check cannot run, say exactly why.

## PHASE 8 — REPORT

1. **Summary.** Project, stack, what was found, what was fixed, what remains,
   verification limits.
2. **Findings table.** ID | severity | issue | cause | status.
3. **Files changed.** Each with the reason.
4. **Checks table.** Check | command | status | evidence. Mark unrun checks.
5. **Remaining problems.** Unresolved bugs, suspected issues, blocked checks,
   required approvals. Never mark an open issue as fixed.
6. **Next actions.** Most important first.
7. **Final assessment.** Exactly one of: `VERIFIED FOR TESTED SCOPE`,
   `PARTIALLY VERIFIED`, `NOT VERIFIED`.
8. **Save it.** Write the report to `docs/audit-<YYYY-MM-DD>-debug.md` before the
   gate. If the project forbids new files, say so and print the report instead.

Never say the project is error-free or secure.

---

## IT'S DONE WHEN

- Every fixed issue has a cause, not just a diff.
- A regression test exists that fails on the old code and passes on the new.
- The same pattern was searched for elsewhere, with the results listed.
- The checks table is complete, with real statuses.
- Remaining problems are listed, not implied fixed.
- The assessment is one of the three allowed verdicts.

## GATE

```
GATE — DEBUG
Done:      <phases completed>
Findings:  CRITICAL _ HIGH _ MEDIUM _ LOW _ NEEDS-PROOF _
Evidence:  <checks table summary>
I need:    which findings to fix now
Reply:     fix DBG-01, DBG-02   |   fix everything safe   |   stop
```

## COMMON FAILURES

- **No baseline.** You cannot tell whether your fix broke something or it was
  already broken.
- **Fixing the symptom.** A null check stops the crash while the real cause keeps
  writing bad data.
- **One hypothesis, no test.** The agent "knows" the answer. Usually it does not.
- **Green by deletion.** A removed test, a disabled rule, an added catch. The bug
  is still there, now invisible.
- **Fixing everything at once.** Three changes, one verification. If it fails, you
  cannot tell which one.
- **Declaring victory after a build.** Compilation is not behaviour.
- **Debugging the whole repo when the task was one error.** Scope creep hides the
  real fix.
