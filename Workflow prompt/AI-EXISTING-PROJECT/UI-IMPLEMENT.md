# UI-IMPLEMENT — build a supplied design into an existing project

> **How to use — one line:**
> `Read AI-EXISTING-PROJECT/UI-IMPLEMENT.md and apply it to this project.`
> Attach the screenshots or Figma export, or give the path. The AI reads the
> project first, plans, and stops for approval before it edits anything. No file
> access? Paste this whole file instead.

**Task:** implement a supplied design · **Input:** design references + the current
codebase · **Produces:** the design implemented inside the existing app, with a
visual diff · **Gate:** the plan is approved before the first edit, then one
screen at a time.

The design is the source of truth for **how it looks**. The project is the source
of truth for **how it works**. When they conflict, the project wins on behaviour
and the design wins on appearance. Say so when that happens.

This is a task file, not a lane. `FULL` does not run it. `UI.md` judges the
interface you already have. This file builds the interface you were given.

---

## USE WHEN

- You have screenshots, a Figma link or export, or a reference site, and want it
  in the app that already exists.
- The project keeps its routes, data, and logic. The change is visual, or visual
  plus one behaviour you name.
- The design is a real target, not a mood board.

Not this file:

| You have | Use |
|---|---|
| An empty folder and a design | `AI-Build-Workflow/01-PLAN.md`, then `02-BUILD.md` |
| A working app and no design, just doubt about the UI | `UI.md` |
| A control that exists but goes nowhere | `DEBUG.md` |
| One small visual change you can describe in six lines | `AI-Build-Workflow/02-BUILD.md`, small change path |

---

## START HERE

Fill this in. Missing fields become questions, not guesses.

```
Read AI-EXISTING-PROJECT/UI-IMPLEMENT.md and apply it to this project.

DESIGN:    <attached files, folder path, or Figma link>
SCREENS:   <which screens, e.g. dashboard, settings, login>
VIEWPORT:  <reference width, e.g. 1440 desktop and 390 mobile>
BEHAVIOUR: visual only | visual plus <the one behaviour>
DO NOT:    <off limits: routes, auth, payments, schema, files>
```

If `SCREENS` is blank, implement every screen in the reference. If `VIEWPORT` is
blank, ask once and default to the widths in the screenshot.

---

## RULES

1. **Read-only until the plan is approved.** Do not edit, create, move, or delete
   a file, and do not run the app, builds, or installs before I approve. Phase 1
   and 2 are inspection only.
2. **Project first, design second.** Detect the framework, styling, routing,
   state, and components from the files. Never assume a stack or a folder layout.
3. **The design is the source of truth for appearance.** Do not redesign,
   simplify, or "improve" it. No new visual language, no substituted font, no
   invented spacing system.
4. **Modify the real app.** No parallel demo, no copy folder, no storybook-only
   implementation. The change lands in the files that serve the real route.
5. **Reuse what exists.** Shared components, tokens, icons, and assets first. A new
   dependency or icon set needs a one-line justification and my approval.
6. **Preserve behaviour.** Endpoints, request and response shapes, auth, sessions,
   validation, routing, state, search, and pagination stay as they are unless I
   named the behaviour change.
7. **No fake data.** Do not hardcode rows, names, or totals to make a screen look
   finished. If a screen needs data and the data is not there, report the empty
   state and the real source.
8. **One screen or component per step.** The app compiles and renders after every
   step. If it does not, the step was too large.
9. **Protect my work.** Check the working tree before editing. Never revert,
   overwrite, or delete uncommitted changes without permission. No destructive
   git command.
10. **Mask secrets.** Show `sk_l****` and the location. Never print a full key,
    token, or password from `.env`.
11. **Never claim pixel-perfect.** Without rendering the app at the reference
    viewport and comparing, say what you could not verify. `NEEDS-PROOF` is a
    real answer.
12. **Ask only when it changes the result.** A missing state, a font you do not
    have, or two plausible destinations. Otherwise decide, mark it assumed, and
    continue.

---

## PHASE 1 — RECON (read-only)

Detect from the repo, not from habit:

- Framework, version, package manager, build and run commands.
- Styling: CSS modules, Tailwind, styled-components, SCSS, plain CSS, tokens.
- Component library, icon set, fonts, and where assets live.
- Routes, layouts, and which file renders each screen.
- State management, data fetching, API clients, and where the contracts are.
- Auth and session behaviour on the screens in scope.
- Design system: shared buttons, inputs, cards, spacing and colour tokens.
- Breakpoints defined in code or config.
- Working tree status: modified and untracked files. Do not touch them.
- Existing loading, empty, error, and success states.

**Output:** a short recon table — area | finding | evidence `path:line`. Then a
list of what you could not determine, and why.

## PHASE 2 — MAP AND PLAN (read-only, ends at the gate)

For each reference screen:

```
screen | route | file that renders it | shared components | tokens used | gap
```

Then:

1. **Gaps.** Missing components, missing tokens, assets you do not have, and any
   place the design contradicts the app. Name the contradiction; do not hide it.
2. **Blast radius.** Every shared component you would change, and its other
   usages. A header change touches every page.
3. **Order.** Tokens and shared layout first, then screens, then states, then
   responsive. Say if a step can invalidate the rest.
4. **Steps.** Table: step | goal | screens and files | size S/M/L | verify with |
   rollback. Nothing size L — split it.
5. **Assumptions.** Each one in a line, with what changes if it is wrong.
6. **Verification.** The exact viewport, route, and check for each screen.

**Output the plan, then stop. Write no code.**

```
GATE — UI-IMPLEMENT
Done:       recon and plan complete; no file changed
Evidence:   recon: <framework, styling, routes found>
            screens: <n mapped to routes, n unmatched>
            gaps: <missing components, tokens, assets>
            risk: <shared components touched, work in the tree>
            plan: <n steps, first step>
I need:     approve the plan, or change the scope
Reply:      approve   |   change the scope   |   stop
```

---

## PHASE 3 — IMPLEMENT

Work in this order unless the plan says otherwise:

1. **Tokens and shared primitives** — colour, spacing, radius, type scale.
2. **Shared layout** — header, sidebar, footer, page shell.
3. **One screen at a time** — top to bottom, largest regions first.
4. **Connect to existing data** — real queries, real props, real handlers. No
   mock layer left behind.
5. **States** — loading, empty, error, long text, narrow width.
6. **Responsive** — the reference width first, then the breakpoints the project
   already defines.

Per step:

- Smallest diff that reaches the design. No drive-by refactor.
- Keep visual and logic changes in separate steps.
- Do not duplicate a component that already serves the purpose.
- If a shared component must change, list its other usages first and check them
  after.
- Do not remove a feature to match a screenshot. If the design has no place for
  it, ask where it should live.
- Run the app after the step and report what rendered.

---

## PHASE 4 — VISUAL COMPARE (loop)

With permission to run the app:

1. Render each screen at the reference viewport, same route, same state.
2. Compare in this order: **geometry → spacing → typography → colour and assets →
   states → decoration**.
3. Fix the largest difference first. Re-render. Repeat until only minor
   differences remain.
4. Check mobile at the project's smallest breakpoint when a mobile reference
   exists, or when the project claims responsive support.
5. Record the result:

```
screen | viewport | geometry | spacing | type | colour/assets | states | status
```

Statuses, only these: `PASS` · `FAIL` · `BLOCKED` · `NOT RUN` · `N/A`. Add
`(code only)` when you only read code.

If you cannot run the app or capture a screenshot, say exactly which checks were
not performed, mark them `NOT RUN`, and give me the command or the manual click
path to finish them.

---

## PHASE 5 — REPORT

1. **Implemented.** Screens and components, one line each.
2. **Files changed.** Path and what changed in it.
3. **Preserved.** Routes, endpoints, auth, data, and logic you did not touch.
4. **Verification table.** From Phase 4, with real statuses.
5. **Remaining differences.** Each one with a reason: missing asset, unclear
   reference, blocked by behaviour, not in scope.
6. **Unverified.** What you could not run, and the exact next command.
7. **Assumptions.** What you decided and what changes if it is wrong.
8. **Save it.** Write the report to `docs/design-implement-<YYYY-MM-DD>.md`. If
   the project forbids new files, say so and print the report instead.

Never say the screen is pixel-perfect, finished, or production-ready. Say what
matched at which viewport, and what did not.

---

## IT'S DONE WHEN

- Every screen in scope is implemented in the real route, not a demo.
- The plan was approved before the first edit.
- Shared components were checked at their other usages.
- Behaviour, contracts, auth, and data are unchanged, or the change I asked for
  is listed.
- Real data or an honest empty state is shown. No hardcoded rows.
- The visual table has a real status per screen and viewport.
- Remaining differences are written down, not implied fixed.

## COMMON FAILURES

- **Rebuilding the page beside the old one.** Two implementations, one broken.
- **Matching the screenshot with fake data.** It looks right and proves nothing.
- **Changing a shared header for one screen.** Every other page moves too.
- **Adding a UI library to copy one card.** New dependency, new visual language.
- **Calling a screenshot match "pixel-perfect".** Without a render and a compare,
  it is a claim, not a result.
- **Dropping a feature the design did not show.** The design is a view, not a
  requirements cut.
- **Skipping loading and error states.** They are part of the screen.
- **Touching uncommitted work.** Someone else's change disappears.
