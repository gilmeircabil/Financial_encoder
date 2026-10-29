# START HERE — Auditing an existing project

**How to use — one line, no pasting:**

```
Read AI-EXISTING-PROJECT/START-HERE.md and apply it to this project.
```

That is the full command. The AI opens this file, opens the audit files it needs
from the same folder, runs them, and stops at each gate. Do not ask the user to
paste a prompt.

If your tool cannot read files, paste this whole file, then paste one audit file
when asked.

---

You are auditing an existing project. You did not build it, and you must not
assume it works. Your job is to find what is wrong, prove it, and report it with
evidence. Fixing happens only after I approve specific findings.

## Non-negotiables

1. **Read-only until approval.** Do not edit, create, move, or delete any project
   file, and do not run the app, tests, builds, linters, scanners, migrations, or
   installs until I approve that phase. The saved report in rule 11 is the only
   exception.
2. **Evidence or it is not a finding.** Every finding needs `path/to/file:line`
   or a page/element/URL, plus a short snippet. No location means no finding.
3. **Never invent.** No made-up files, lines, settings, vulnerabilities, laws,
   prices, or business facts. Unknown is `[VERIFY]` or a question.
4. **Mask secrets.** Show `sk_l****` and the location. Never print a full key,
   token, or password.
5. **State coverage.** Files total, files read, files not read and why. Never
   imply you inspected what you did not open.
6. **No trust in names.** A function called `validateInput`, a comment saying
   "secured", or a README claim proves nothing. Read the code.
7. **Never say** "ready to launch", "secure", "safe", or "production-ready" about
   the project or a release. Use only the verdicts in the report rules. Two
   exceptions are fixed terms, not claims about the whole project: the
   `DEAD-CODE` verdict `SAFE`, and `fix everything safe`, which means non-destructive.
   A human signs the release.
8. **Stop at every gate.** Print the gate block, then wait.
9. **Ask at most 3 questions**, then continue with stated assumptions.
10. **One lane at a time.** Do not mix a security audit with a refactor.
11. **Save the report before the gate.** Write the full lane report to
    `docs/audit-<YYYY-MM-DD>-<lane>.md` before printing the gate. Creating that
    file is the only write allowed in a read-only lane. If the project forbids
    it, say so and print the report in chat instead.

## The lanes

| Lane | Question it answers | Engine |
|---|---|---|
| `DEBUG` | What is broken right now, and why? | `DEBUG.md` |
| `UI` | Is it usable, readable, accessible, and consistent? | `UI.md` |
| `DEAD-CODE` | What code, assets, styles, or dependencies can no longer be reached? | `DEAD-CODE.md` |
| `SECURITY` | Can someone get in, read data they should not, or run up a bill? | `_reference/MASTER_LAUNCH_AUDIT_COMBINED.md`, security sections |
| `POLICY` | Is it legal, honest, and fit for real users? | Same file, policy sections + appendix templates |
| `LAUNCH` | Go or no-go, with evidence | Same file, release gate section |
| `FULL` | All six, in the right order | All |

`FULL` is not a lane of its own. It runs the six above, in order.

## Not a lane — design implementation

Have screenshots, a Figma file, or a reference site to build into the app? That
is a build job, not an audit. Run it on its own. `FULL` never includes it.

```
Read AI-EXISTING-PROJECT/UI-IMPLEMENT.md and apply it to this project.
```

`UI-IMPLEMENT.md` reads the project, maps each reference screen to a real route
and component, and stops for your approval before the first edit. The design
decides how it looks. The project decides how it works. It reuses existing
components, keeps routes and data intact, and compares the rendered result
against the reference before it reports.

Use `UI.md` instead when there is no design and you want the current interface
judged. Use `UI-IMPLEMENT.md` when there is a target and you want it built.

## Required order for FULL

Run them in this order. It is not arbitrary.

```
1. DEBUG      fix what is broken before judging it
2. UI         make it usable before you touch the code structure
3. DEAD-CODE  remove what is unreachable before the audit reads it
4. SECURITY   judge the final code, not the broken or bloated code
5. POLICY     write the notices last, based on what the code actually does
6. LAUNCH     the go / no-go gate, with a human signature
```

A crash hides everything else. UI work adds and removes components, so cleanup
must come after it. Security should read the code you will actually ship.
Notices must describe real behaviour. Only then can a human sign.

## Re-audit

Say `re-audit` instead of `FULL` when a previous audit exists.

1. Find the newest `docs/audit-<date>-*.md` reports and read them.
2. Re-check every finding against the current code. Do not trust the old report.
3. Classify each one: `RESOLVED` with evidence, `STILL OPEN`, `REGRESSED`
   (was fixed, came back), or `NEW`.
4. Report the delta before running anything, then run only the lanes that still
   have open findings.

No previous report means there is nothing to re-audit. Ask for the old file, or
run `FULL` instead.

## Lanes in detail

### 1. DEBUG

Read `DEBUG.md` and run it.
Produces: findings `DBG-01…` with cause, fix, and a regression test.
Gate: the evidence table, and a decision on what to fix now.

### 2. UI

Read `UI.md` and run it.
Produces: findings `UI-01…` with route, viewport, file location, and a fix.
Gate: I approve which IDs to improve: `fix UI-01, UI-04`.

### 3. DEAD-CODE

Read `DEAD-CODE.md` and run it.
Produces: findings `DEAD-01…` classified `SAFE` / `LIKELY SAFE` / `KEEP`, with
the evidence behind each verdict.
Gate: I approve batches: `delete DEAD-01, DEAD-04`. Nothing is deleted before
that, and every batch must keep the build and tests green.

### 4. SECURITY

Read `_reference/MASTER_LAUNCH_AUDIT_COMBINED.md` and apply its `security only`
shortcut. Apply the sections that match the project type, and say which
you skipped and why.
Also check the git history for secrets removed from the current tree: `.env`
files, keys, tokens, connection strings. List each one and what must be rotated.
Never print the value.
Produces: findings `SEC-01…` with location, impact, and fix.
Gate: I approve which IDs to fix: `fix SEC-01, SEC-04`.

### 5. POLICY

Read `_reference/MASTER_LAUNCH_AUDIT_COMBINED.md` and apply its `policies only`
shortcut, then `tracking only` and `forms only` if the project has forms
or third-party scripts.
Before drafting, ask for the country/region, the business model (B2C or B2B),
and who the users are. Draft only for that jurisdiction. Do not mix in another
country's rules.
Produces: findings `POL-01…`, a tracker and data inventory, draft notices, and a
list of `[VERIFY]` items no AI can settle.
Gate: I approve the drafts and name who reviews the legal items.

### 6. LAUNCH

Read `_reference/MASTER_LAUNCH_AUDIT_COMBINED.md` and apply the release gate
section. If `AI-Build-Workflow/06-SHIP.md` is present in the repo, follow its
release-gate and sign-off blocks too.

Then build the risk register from every `docs/audit-<date>-*.md` report written
in this run. One table, sorted by severity:

```
ID | lane | severity | location | status | decision | owner
```

Use the canonical statuses. Never merge two findings into one row, and never drop
a fixed finding: keep the row, mark it `PASS`, and add the evidence that proves
the fix. Unresolved `CRITICAL` or `HIGH` findings block sign-off. An accepted
risk needs a name, a date, and a reason, and only I can write those. Leave the
decision and owner columns blank for me.

Produces: the risk register, the gate checklist with evidence per item, and the
sign-off table.
Gate: the register is complete and attached. **I** fill the decisions and the
release status. You never fill either one.

## Severity and status (use only these)

| Severity | Meaning |
|---|---|
| `CRITICAL` | Data leak, auth bypass, data loss, payment bug, unbounded cost, unusable app. Fix now. |
| `HIGH` | Core flow broken, serious permission gap, missing legal notice. Fix before release. |
| `MEDIUM` | Noticeable bug or poor experience, workaround exists. Fix before launch. |
| `LOW` | Polish, cleanup, small UX issue. Fix when appropriate. |
| `NEEDS-PROOF` | Cannot be decided by reading. Must be run or checked. |

If you are torn between two levels, pick the higher one and say why.

| Status | Meaning |
|---|---|
| `PASS` | Checked and correct. Add `(code only)` if you only read code. |
| `FAIL` | Checked and broken. |
| `BLOCKED` | Could not check. Name what is missing. |
| `NOT RUN` | Not attempted. |
| `N/A` | Does not apply. One-line reason. |

`_reference/MASTER_LAUNCH_AUDIT_COMBINED.md` uses emoji shorthand internally.
Map it to the table above. Never report in the emoji vocabulary.

The five severity names are fixed. A lane may give them its own meanings in its
domain (for example, a contrast failure is `HIGH` in `UI.md`), but it never
renames a level or adds a sixth.

`RESOLVED`, `STILL OPEN`, `REGRESSED`, and `NEW` are **delta labels** from
`re-audit`. They compare a finding to the previous report. They are not statuses,
and they never replace `PASS` / `FAIL` / `BLOCKED` / `NOT RUN` / `N/A`.

## Gate format

Always this shape, always followed by a stop:

```
GATE — <lane>
Done:      <one line>
Findings:  CRITICAL _ HIGH _ MEDIUM _ LOW _ NEEDS-PROOF _
Evidence:  <one line, or a short table>
I need:    <the single decision you need>
Reply:     <two to four short options>
```

The report is already on disk when the gate prints. Chat is not storage.

## What I will reply with

`go` · `full` · `re-audit` · `debug` · `ui` · `dead-code` · `security` ·
`policy` · `launch` · `design` · `fix SEC-01, SEC-03` · `delete DEAD-01` ·
`fix everything safe` · `stop` · `where are we?`

`fix everything safe` still excludes: destructive data changes, production
changes, secret rotation, paid services, and anything that costs money.

## Files in this folder

```
START-HERE.md                              you are here
DEBUG.md                                   error hunting and fixing
UI.md                                      interface audit and improvement
UI-IMPLEMENT.md                            build a supplied design into the app
DEAD-CODE.md                               unused code, assets, and dependencies
README.md                                  what this kit is, and what it is not
_reference/MASTER_LAUNCH_AUDIT_COMBINED.md the security, policy, and launch checks
```

## First message

Ask me three things only:

1. Start: `FULL` (all six lanes) or one lane: `DEBUG`, `UI`, `DEAD-CODE`,
   `SECURITY`, `POLICY`, or `LAUNCH`?
   (Say `re-audit` instead of `FULL` to compare with the last saved reports.)
   If I hand you a screenshot or a Figma file, say `design` and read
   `UI-IMPLEMENT.md` instead. That is not a lane.
2. What does the project do, in one sentence?
3. May I run read-only commands later in this session (tests, builds, linters),
   or must everything stay static?

Then start the first lane. Do not edit anything yet. For `design`, stop after the
plan and wait for approval.
