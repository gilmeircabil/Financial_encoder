# UI — audit and improve the interface of an existing project

> **How to use — one line:**
> `Read AI-EXISTING-PROJECT/UI.md and apply it to this project.`
> The AI runs the phases in order and stops at each gate. No file access? Paste
> this whole file instead.

You did not design this interface. Do not impose a new visual language on it.
Judge what is there against usability, accessibility, and consistency, prove
every claim, then change only the items I approve.

A UI finding is not a matter of taste. "I would use more padding" is not a
finding. "The submit button is 28×28 px at 375 px wide, below the 44×44
recommended touch size, `src/components/Form.tsx:88`" is a finding.

---

## RULES

1. Inspect and report before changing anything. Do not run the app, tests, builds,
   or installs until I approve commands.
2. Every finding needs `path/to/file:line` plus the route, selector, and viewport,
   or a URL. No location means no finding.
3. Never invent a screenshot, a measurement, a contrast ratio, or a device
   result. If you cannot render the page, say so and mark it `NEEDS-PROOF`.
4. Never claim "WCAG compliant" or "accessible". Report specific failures and
   specific passes. Conformance is an audit by a human, not a code review.
5. Preserve the brand, the content intent, and the existing component library.
6. Use existing tokens and components before adding a new one. No new colour,
   spacing, font, icon set, or animation library without approval.
7. Do not change behaviour while changing appearance. A UI fix that alters logic
   is two changes and needs two approvals.
8. Do not hide content to pass a check. No `display:none`, no `aria-hidden` on
   real content, no removing labels to fix spacing.
9. One screen or component at a time. The app must render after each change.
10. Do not redesign what I did not ask you to redesign. Improvement is not a
    new style.

---

## PHASE 1 — INVENTORY

Detect, from the repo and not from assumption:

- Framework, styling system, component library, icon set, fonts.
- Routes and screens, including auth-only and error screens.
- Shared layout, navigation, footer, and design tokens.
- Breakpoints defined in code or config.
- Target browsers and devices claimed by the repo, if any.
- Existing loading, empty, error, and success states.
- Screens that need data, auth, or a paid service to render.

**Output:** a screen list with the file that renders each one, and a list of
screens you cannot inspect without running the app.

## PHASE 2 — EVIDENCE

With my approval to run the app, capture each primary screen at:

```
320 px   375 px   768 px   1024 px   1440 px
```

Then, on every primary flow:

- Keyboard only, no mouse. Tab order, focus visibility, focus traps.
- Browser zoom at 200%.
- Reduced motion enabled.
- Windows High Contrast or forced-colors mode where available.
- The actual values: contrast ratio, tap-target size, overflow, scroll traps,
  clipped text, elements covering each other.

Without approval to run, do static analysis only, mark every visual claim
`(code only)`, and put rendering questions under `NEEDS-PROOF`. Reading a
className is not seeing the page.

## PHASE 3 — AUDIT

Cover what applies. Say `N/A` with a reason when it does not.

**A. Layout and responsive.** Horizontal scroll at 320 px, overlap, clipped text,
fixed widths, images that overflow, tables that break, modals taller than the
viewport, sticky elements covering content, RTL and long translated strings that
overflow.

**B. Hierarchy and typography.** Heading order and levels, one obvious primary
action per screen, line length, line height, text that is too small, all-caps
blocks, truncation without a way to read the rest.

**C. Colour and contrast.** Text and icons below 4.5:1 (3:1 for large text and
UI boundaries), colour as the only signal, dark mode contrast, disabled states
that cannot be read, focus rings that disappear on some backgrounds.

**D. States.** Loading, empty, error, success, disabled, offline, slow network,
permission denied, long content, zero results, partial data. A screen that only
exists in the happy state is a finding.

**E. Forms.** Labels tied to inputs, required markers, inline errors next to the
field, error text announced, autocomplete attributes, correct input types,
paste allowed, no placeholder-as-label, sensible tab order, submit feedback.

**F. Navigation.** Current-page indication, back behaviour, deep links, 404 and
403 screens, breadcrumbs where depth demands them, mobile menu reachable and
closable by keyboard, no dead links.

**G. Feedback and errors.** Does the user know what happened after an action?
Are errors plain language with a next step? Are destructive actions confirmed?
Is success visible without a page reload?

**H. Accessibility.** Alt text that describes purpose, decorative images hidden,
landmarks, skip link, page title per route, language attribute, ARIA only where
native HTML cannot do the job, no keyboard traps, no positive `tabindex`, media
captions, motion that can be paused.

**I. Motion.** Duration and easing consistency, `prefers-reduced-motion` respected,
no parallax or autoplay that cannot be stopped, no animation blocking input.

**J. Consistency.** Spacing scale, radius, shadow, button variants, icon weight,
date and number formats, capitalisation, link styling, hover and focus parity.

**K. Content and microcopy.** Button labels that state the action, error messages
that state the fix, jargon, ambiguous "OK", empty states that say what to do
next, inconsistent product names.

**L. Perceived performance.** Layout shift, images without dimensions, fonts that
flash or block, spinners with no minimum visible time, skeleton screens that
never resolve.

**M. Trust and finish.** Favicon, page titles, meta description, social preview,
custom 404, broken images, placeholder text left in production, `TODO` in copy.

## PHASE 4 — FINDINGS

Use only these levels. If torn between two, pick the higher one and say why.

| Level | Meaning |
|---|---|
| `CRITICAL` | Cannot use the screen: unreadable, unclickable, blocked at a supported size. |
| `HIGH` | Core flow hard or impossible for a group of users: keyboard, contrast, zoom, mobile. |
| `MEDIUM` | Noticeable problem, workaround exists. |
| `LOW` | Polish, consistency, microcopy. |
| `NEEDS-PROOF` | Cannot be decided without rendering or a real device. |

Format each finding:

```
UI-01
Severity:    HIGH
Confidence:  Confirmed | Needs runtime
Route:       /checkout
Location:    src/components/CheckoutForm.tsx:88  (button.submit)
Viewport:    375 px
Problem:     Submit button measures 28x28 px and sits 4 px from the sticky footer.
Evidence:    class "btn-sm" with padding 4px 6px; overlaps footer at 375 px.
Impact:      Below the 44x44 recommended touch size. The WCAG 2.2 AA minimum is
             24x24 px, so pass/fail depends on the target you declared.
Fix:         Use the default button size at small breakpoints.
```

Sort by severity. A cosmetic finding is `LOW`, and saying so is not an insult to
the design.

## PHASE 5 — IMPROVE

If no finding IDs have been approved yet, edit nothing. Go to Phase 7, write the
report, and print the gate.

Only approved IDs, in this order:

1. Blocks the task: cannot read, cannot tap, cannot submit, cannot navigate.
2. Blocks understanding: unclear hierarchy, unclear state, unclear error.
3. Blocks access: contrast, labels, keyboard, zoom, reduced motion.
4. Polish: spacing, consistency, microcopy.

For each change:

- Smallest change that fixes the finding.
- Use the existing token or component. If none exists, propose one token, not a
  one-off value.
- Keep the DOM order and the focus order.
- Do not change API calls, validation rules, or data shape.
- Record before and after in one line each, plus the file and line.

## PHASE 6 — VERIFY

Re-check the same screens and flows that produced the findings.

| Check | Method | Status | Evidence |
|---|---|---|---|
| 320 px, no horizontal scroll | render | | |
| 375 / 768 / 1024 / 1440 px | render | | |
| Keyboard-only, primary flow | manual | | |
| Focus visible on every control | manual | | |
| 200% zoom, no clipping | manual | | |
| Contrast 4.5:1 text, 3:1 UI | measured | | |
| Labels and errors announced | DOM + assistive tech | | |
| Reduced motion respected | setting | | |
| Loading / empty / error states | render | | |
| No console errors | devtools | | |
| Build, typecheck, tests | commands | | |

Statuses, only these: `PASS` · `FAIL` · `BLOCKED` · `NOT RUN` · `N/A`.
Add `(code only)` when you only read code.

## PHASE 7 — REPORT

1. **Summary.** Screens inspected, screens not inspected and why, what changed.
2. **Findings table.** ID | severity | screen | issue | status.
3. **Changes.** File, line, before, after, finding ID.
4. **Verification table** from Phase 6.
5. **Remaining problems.** Unverified screens, blocked checks, open findings.
6. **Next actions.** Most important first.
7. **Assessment.** Exactly one of: `VERIFIED FOR TESTED SCOPE`,
   `PARTIALLY VERIFIED`, `NOT VERIFIED`.
8. **Save it.** Write the report to `docs/audit-<YYYY-MM-DD>-ui.md` before the
   gate. If the project forbids new files, say so and print the report instead.

Never say the interface is accessible, polished, or finished. Say what was
tested, at which sizes, and what was not.

---

## IT'S DONE WHEN

- Every primary screen has a finding, a `PASS` line, or an explicit `N/A` line.
- Every finding has a route, a viewport, and a file location.
- Every fixed finding has a before and after line.
- Keyboard, zoom, and contrast were checked or marked `BLOCKED`.
- The verification table has real statuses, not intentions.
- Remaining screens are listed, not implied checked.

## GATE

```
GATE — UI
Done:      <phases completed>
Findings:  CRITICAL _ HIGH _ MEDIUM _ LOW _ NEEDS-PROOF _
Evidence:  <screens x viewports, checks table summary>
I need:    which findings to improve now
Reply:     fix UI-01, UI-04   |   fix everything safe   |   stop
```

## COMMON FAILURES

- **Reviewing CSS instead of pages.** A class name does not prove a layout.
- **One viewport.** Desktop-only review misses most responsive defects.
- **Taste reported as severity.** "Feels cramped" is not a finding. Measure it.
- **Fixing contrast by darkening everything.** It breaks hierarchy and brand.
- **Hiding to pass.** `display:none` on content or a label is not a fix.
- **Redesigning the app.** The task was improvement, not a new direction.
- **Claiming accessibility from checklists.** Reading `alt` attributes is not a
  screen-reader test.
- **Leaving states out.** The empty and error screens are part of the interface.
