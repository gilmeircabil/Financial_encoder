# 02 — BUILD

> **How to use — one line:**
> `Read AI-Build-Workflow/02-BUILD.md and apply it to this project.`
> The AI runs the blocks in order and stops at each gate. You only answer
> questions. No file access? Paste this whole file instead. Want manual control?
> Paste one block at a time.

**Run mode:** BUILD · **Input:** approved spec from `01-PLAN.md` · **Produces:**
working code, one verified step at a time · **Gate:** the app runs after every
step.

The rule that makes this stage work: **the app compiles and runs after every
single step.** Not after the feature. After the step. If it does not, the step
was too big.

---

## USE WHEN

- The spec is approved and code is next.
- The task touches more than one file.
- You are about to say "build the whole thing" — that is the signal to slow down.

---

## SMALL CHANGE PATH

Use this instead of Blocks 1–2 when the change is **one behaviour in one place**:
add a button, change a label, hide a section, fix a link, adjust one style rule.
You skip the PRD and the approach ranking, and **start at Block 3**.

It is not for everything that looks small. Sort it first:

| What you have | Where it goes |
|---|---|
| The design says the control should be there and it is missing | This path — the spec below |
| A button exists but goes nowhere, loops, or crashes | `04-DEBUG.md` |
| You want the whole interface judged, not one control added | `AI-EXISTING-PROJECT/UI.md` |
| You have a screenshot or Figma file to match on many screens | `AI-EXISTING-PROJECT/UI-IMPLEMENT.md` |
| The change touches schema, auth, money, or production data | Full stage. Not this path |

### The micro-spec

Six lines. The AI writes no code until you approve them. This is the accuracy
step: most bad small changes are a vague instruction, not bad code.

```
CHANGE:      one sentence, one behaviour
DESTINATION: where it goes — a route, a state, or a callback
SHOW WHEN:   the exact condition it appears
HIDE WHEN:   the exact condition it disappears, or `never`
ACCEPTANCE:  numbered checks that can be watched, not "it works"
DO NOT:      files, packages, routing, or layout that must not change
```

Then paste it with this stage's one-line command:

```
Read AI-Build-Workflow/02-BUILD.md and apply it to this project.

CHANGE:      <one behaviour>
DESTINATION: <where it goes>
SHOW WHEN:   <condition>
HIDE WHEN:   <condition or never>
ACCEPTANCE:  <numbered checks>
DO NOT:      <off limits>
```

The AI replies with the numbered step, the files it will touch, and how it will
verify. Then it stops. You say `go` or `fix the spec`.

### Rules

1. **Spec approved before code.** No exceptions, even for one line.
2. **The architecture rules below still apply.** Skipping Blocks 1–2 skips the
   paperwork, not the conventions: the same boundaries, server-side rules, and
   dependency checks.
3. **One change per step.** "Add a back button and fix the header spacing" is two
   steps, and you cannot tell which one broke the page.
4. **Reuse what exists.** Match the current button, spacing, colour, and icon set.
   A new dependency for one control is a defect, not a feature.
5. **Every destination has a fallback.** "Go back" with no history does nothing or
   leaves the site. Decide the fallback in the spec, not in the code.
6. **Verify the edges, not the happy path.** Direct link, reload, keyboard, small
   screen, empty state, double click.
7. **Say what did not change.** The AI lists the files it touched and confirms the
   others in `DO NOT` are untouched.

### Worked example — a back button

```
CHANGE:      Add a back control to the detail screen.
DESTINATION: previous page if it is same-origin, otherwise /dashboard
SHOW WHEN:   a same-origin history entry exists, or the fallback route exists
HIDE WHEN:   never
ACCEPTANCE:  the eight checks below
DO NOT:      add a package, change routing, refactor the header
```

Acceptance checks, all of them observable:

1. From a subpage, back returns to that subpage.
2. Opened by direct link, back goes to `/dashboard`. It does not leave the app.
3. Back pressed twice never loops between two pages.
4. `Tab` reaches it; `Enter` and `Space` both activate it.
5. Focus is visible while it is focused.
6. A screen reader says "Go back", not "left arrow".
7. The tap target is at least 44 × 44 px at 375 px wide.
8. The browser's own back button still works, and the console is clean.

Never accept `history.back()` alone. It fails on a reload, on a direct link, and
inside an embedded webview.

### It is done when

- The micro-spec was approved before any file changed.
- One behaviour changed, and the verification table proves each acceptance check.
- `DO NOT` files are untouched, and the app still runs.
- Anything not verified is listed as `NOT RUN`, never implied.

---

## ARCHITECTURE RULES (apply for the whole stage)

- Define the boundary between frontend, backend, database, storage, and external
  services before writing code. Write it in one line each.
- Business rules and security decisions live on the server. The browser is a
  rendering surface, not a control point.
- Use the framework's supported patterns. Do not invent a structure the
  framework fights.
- Define API contracts up front: inputs, outputs, error shape, pagination,
  timeout, versioning if clients will outlive this release.
- Separate development, test, and production configuration from day one. A
  hardcoded localhost URL is a launch bug waiting.
- Before adding a dependency: check maintenance status, licence, install size,
  permissions, and advisories. Justify it in one line. Prefer what you already
  have.
- Keep lockfiles committed. Builds must be reproducible.
- Record decisions that someone would otherwise question in six weeks. One
  paragraph each is enough.

---

## BLOCK 1 — Plan the task (no code)

```
Enter plan mode. Do not write code, do not create files, do not run commands.

Task: <paste the task or the spec section>
Spec: docs/spec-<flow>.md
MODE: <prototype | staging | production>
Constraints: <deadline, stack limits, no-go zones, files that must not change>

Do this:
1. List every file this task touches, with one line on what each does today.
2. State current behaviour vs target behaviour, side by side.
3. Propose two or three approaches. For each: complexity, risk, blast radius,
   and what it makes harder later. No straw men.
4. Pick one in three lines: why this one, what you are giving up.
5. Break it into steps. Each step must leave the app compiling and running, and
   must have its own verification command or click path.
6. For each step: files touched, what changes, size S/M/L, and how I verify it.
7. Put the riskiest unknown first. If step 1 could invalidate the plan, say so.
8. List risks, each with the exact rollback (the specific git command, flag, or
   migration-down).
9. Flag anything touching auth, payments, migrations, production data, or
   external spend for my explicit sign-off.

Then stop and wait. Do not write a single file.
```

**Why 2–3 approaches.** An agent given one path will defend it. Given three, it
will rank them, and the ranking is where the real tradeoff shows up. Refuse any
option described only as "more complex".

## BLOCK 2 — Implementation sequence

```
Turn the approved approach into a numbered build sequence.

Rules:
- Each step ends with the app compiling and running.
- Each step is independently verifiable and independently revertible.
- No step mixes a refactor with a behaviour change.
- New dependency or migration: call it out as its own step.
- Size every step S / M / L. Anything L gets split before we start.
- Order by risk: the assumption most likely to be wrong goes first.
- Anything that touches schema, auth, money, or prod config is marked
  [NEEDS SIGN-OFF].

Output a table: step | goal | files | size | verify with | rollback.

Then wait for my "go" before step 1. After each step, stop and show me:
- what changed
- the verification result with the status (PASS / FAIL / BLOCKED / NOT RUN / N/A)
- the diff summary
- what the next step is

Do not run ahead. Do not batch steps to save time.
```

## BLOCK 3 — Execute one step

```
Execute step <N> only.

Before editing: restate in one line what this step achieves.
During: smallest change that achieves it. No adjacent cleanup. No new
abstractions. No extra features.
After: run the verification named in the plan. Report in this exact shape:

COMPLETED:
FILES:
VERIFICATION:  check | status | evidence
LIMITATIONS:
NEXT:

If verification fails: stop. Do not paper over it with a retry, a disabled check,
or a broader catch. Report the failure and the three most likely causes.
```

## BLOCK 4 — Close the stage

```
Before we leave build:
1. Re-read the spec's acceptance checklist. Mark each line PASS, FAIL, or
   NOT VERIFIED, with how you checked it.
2. Run the full local checks: typecheck, lint, build, tests. Report each with a
   status.
3. List anything in the spec that is not implemented, and anything implemented
   that is not in the spec.
4. List known shortcuts taken in this stage that must be fixed before real users.
5. Do not fix them now. Just list them.

Then stop.
```

Item 4 is how you keep a prototype honest. Shortcuts are fine; unrecorded
shortcuts are how prototypes reach production with no rate limiting.

---

## THE STEP LOOP

```
PLAN (block 1)
  |
  v
SEQUENCE (block 2)  ---- you approve ----+
  |                                       |
  v                                       |
STEP N (block 3)                          |
  |                                       |
  +-- FAIL --> fix -> re-verify ----------+
  |                                       |
  +-- PASS --> diff review ---------------+
  |                                       |
  v                                       |
next step --------------------------------+

end of sequence -> CLOSE (block 4) -> 03-CONNECT.md (if there is data or a service)
                                  -> 04-DEBUG.md   (if something broke)
```

---

## IT'S DONE WHEN

- The app runs locally and every flow in the spec, including the small-change
  micro-spec, can be completed by hand.
- Every step has a verification line with a real status.
- The acceptance checklist in the spec is marked, with no unmarked lines.
- Deviations from the spec are either approved in the spec or listed as
  deviations.
- Shortcuts are listed, not hidden.
- No feature exists that is not in the spec.

## GATE

```
GATE — BUILD
Done:      <n> steps verified, acceptance checklist <x>/<y>
Evidence:  app runs; deviations <list>; shortcuts <list>
I need:    approval to start stage 3
Reply:     go   |   fix <step>   |   stop
```

Do not move on with a `FAIL` in the report. A failure carried forward becomes
two failures in the next stage, because now the new code assumes the broken
behaviour.

## COMMON FAILURES

- **One-shot builds.** The agent writes 40 files, it looks impressive, and the
  third click reveals that the state is wired to nothing. Steps exist to make
  failure cheap.
- **Demo logic.** Buttons that look real and write nowhere. Check the data path,
  not the screen.
- **Silent scope growth.** "While I was there I also refactored the API layer."
  That is a separate task with a separate review.
- **Verifying with the build only.** A green build proves syntax. It does not
  prove the flow works. Use the click path.
- **Ignoring the riskiest assumption.** Building the easy 80% first feels
  productive and delays the moment you learn the approach was wrong.
- **Batching steps to "save time".** It never does. It moves the debugging from
  one small diff to a large one.
