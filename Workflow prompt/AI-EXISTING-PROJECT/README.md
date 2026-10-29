# AUDIT KIT — for projects you already have

Point this at a codebase you did not write, or wrote months ago, and get four
things: what is broken, what the interface gets wrong, what code is unused, and
a security, policy, and launch review with evidence.

Not for starting new projects. For that, use `AI-Build-Workflow`.

---

## How to start

One line:

```
Read AI-EXISTING-PROJECT/START-HERE.md and apply it to this project.
```

The AI asks three questions, then runs one lane at a time and stops at each gate.
If your tool reads `AGENTS.md` or `CLAUDE.md` from the project root, it loads this
kit automatically and you do not need to type the line.

## The lanes

| Say | You get | Edits? |
|---|---|---|
| `FULL` | All six lanes in order | Starts read-only |
| `DEBUG` | What is broken, the cause, and a fix with a regression test | Only after approval |
| `UI` | Interface findings `UI-01…` with route, viewport, `file:line`, and a fix | Only after approval |
| `DEAD-CODE` | Unused files, exports, assets, styles, and dependencies, each proven `SAFE` or kept with a reason | Only after approval |
| `SECURITY` | Findings `SEC-01…` with `file:line`, impact, and fix | No |
| `POLICY` | Tracker and data inventory, draft notices, `[VERIFY]` list | No |
| `LAUNCH` | One merged risk register, release gate checklist with evidence, and a sign-off table | No |

`FULL` is a start command, not a lane. It runs the six above in order.

## Not a lane: build a supplied design

Screenshots, a Figma file, or a reference site to implement? That is a build job.
It runs on its own and `FULL` never includes it:

```
Read AI-EXISTING-PROJECT/UI-IMPLEMENT.md and apply it to this project.
```

It reads the project, maps each reference screen to a real route, and stops for
approval before the first edit. It reuses existing components, keeps routes and
data intact, and compares the rendered result against the reference. Use `UI`
when there is no design and you want the current interface judged. Use
`UI-IMPLEMENT` when there is a target and you want it built.

## The order that matters

```
DEBUG      fix what is broken          -> the code you audit should run
UI         is it usable?               -> improve before changing structure
DEAD-CODE  what is unreachable?        -> remove it before the audit reads it
SECURITY   can someone get in?         -> audit the final code
POLICY     is it honest and legal?     -> written from real behaviour
LAUNCH     go or no-go                 -> a human signs
```

Auditing security on top of a crash produces "NOT VERIFIED" everywhere and misses
the real issues behind the crash. UI work adds and removes components, so dead
code must come after it. Security then reads what you will actually ship.

## Re-audit

Say `re-audit` instead of `FULL` when reports from a previous audit exist. The AI
reads the newest `docs/audit-<date>-*.md` files, re-checks every finding against
the current code, and classifies it:

```
RESOLVED    fixed, with evidence
STILL OPEN  still there
REGRESSED   was fixed, came back
NEW         not in the old report
```

You get the delta first, then only the lanes that still have open findings. It
does not trust the old report: every claim is re-checked.

## Files

```
START-HERE.md    the trigger, the lanes, and the rules
DEBUG.md         error hunting and fixing, 8 phases
UI.md            interface audit and improvement, 7 phases
UI-IMPLEMENT.md  build a supplied design (screenshots, Figma) into the app
DEAD-CODE.md     unused code, assets, styles, and dependencies, 7 phases
README.md        this file
_reference\MASTER_LAUNCH_AUDIT_COMBINED.md
                 the S1-S23 checks for security, cost, compliance,
                 accessibility, and the release gate, plus policy templates
```

`_reference\MASTER_LAUNCH_AUDIT_COMBINED.md` does the heavy lifting for security
and policy. `START-HERE.md` tells the AI which shortcut to run, so you never
need to read the whole file yourself.

That file uses emoji markers internally as its own shorthand. They are not the
report vocabulary. Every report this kit produces must use only five statuses —
`PASS`, `FAIL`, `BLOCKED`, `NOT RUN`, `N/A`, plus `(code only)` — and the five
severity levels in `START-HERE.md`.

## What you get at the end

- Findings with IDs, severity, confidence, `file:line`, impact, and a fix.
- UI findings with the route, viewport, selector, and the measured value.
- A dead-code report: what was deleted, what was kept and why, bundle and
  dependency delta, and a rollback for each batch.
- A coverage statement: files total, files read, files not read and why.
- A verdict: `NOT READY` or `NOT FULLY VERIFIED`. Never "ready". The `DEBUG`, `UI`,
  and `DEAD-CODE` lanes end with `VERIFIED FOR TESTED SCOPE`,
  `PARTIALLY VERIFIED`, or `NOT VERIFIED`.
- A gate checklist with a status and an evidence line per item.
- A saved report at `docs/audit-<date>-<lane>.md` for every lane, written before
  the gate.
- One risk register at LAUNCH: every finding from every lane in one table, sorted
  by severity, with the decision and owner left for you.
- On a repeat audit, a delta of `RESOLVED`, `STILL OPEN`, `REGRESSED`, `NEW`.
- Draft privacy, cookie, terms, refund, and accessibility text where applicable,
  every legal claim marked `[VERIFY]`.
- A sign-off table that only a human can complete.

## What this kit will not do

- It will not certify the project as secure. It finds problems; it does not prove
  their absence.
- It will not certify the interface as accessible or polished. It reports specific
  failures and specific passes.
- It will not replace a lawyer. `[VERIFY]` items need a person.
- It will not guarantee the audit is complete. It reports what it did not read.
- It will not sign a release. The signature line is yours.

## Using it on a client's project

1. Copy the whole `AI-EXISTING-PROJECT` folder into the project root.
2. Run `FULL`. Do not skip DEBUG.
3. Each lane writes its report to `docs/audit-<date>-<lane>.md` before the gate,
   so the client sees what was inspected and what was not. Nothing is lost in
   chat.
4. Fix only what the client approved, by ID.
5. Hand over the risk register and the sign-off table with the unverified items
   still visible.
6. On the next visit, run `re-audit` and hand over the delta with the register.
7. If the client supplies a design, run `UI-IMPLEMENT.md` as a separate job and
   get the plan approved before any edit. Do not fold it into the audit.

The coverage statement is the part clients value most. It tells them exactly what
your audit did and did not cover.

`SECURITY`, `POLICY`, and `LAUNCH` never edit project code. `DEBUG`, `UI`, and
`DEAD-CODE` do, so agree in writing which finding IDs are in scope before the
first edit. On a client repo, delete dead code in small approved batches and hand
over the rollback commit for each one. That is usually the cheapest visible win:
less code, a smaller bundle, and a shorter review for the next person.

## Relationship to the build pack

`AI-Build-Workflow` covers planning, building, and shipping new work. This kit
covers judging work that already exists. They share the same rules: evidence,
statuses, severity levels, and gates.

If you maintain both, keep these in sync:

- Severity levels and the status vocabulary. They appear in `START-HERE.md`,
  `DEBUG.md`, `UI.md`, and `DEAD-CODE.md`; change all four together.
- The rule that no AI fills a release status.
- The evidence requirement: `file:line` or it is not a finding.
- `UI.md` and the accessibility sections of the master checklist.
- `DEAD-CODE.md` and `AI-Build-Workflow/07-UPKEEP.md`. The deletion rules must
  agree: one batch, one verification, no test removed to get green.

`AI-Build-Workflow/05-AUDIT.md` and this kit's `SECURITY` and `POLICY` lanes cover
the same ground from different entry points. If you change one, change the other.
