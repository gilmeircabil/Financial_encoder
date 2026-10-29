# 01 — PLAN

> **How to use — one line:**
> `Read AI-Build-Workflow/01-PLAN.md and apply it to this project.`
> The AI runs the blocks in order and stops at each gate. You only answer
> questions. No file access? Paste this whole file instead. Want manual control?
> Paste one block at a time.

**Run mode:** BUILD · **Produces:** `docs/prd-<feature>.md`, `docs/spec-<feature>.md`,
`docs/ui-<feature>.md` · **Gate:** you approve scope, then approve the spec.

Nothing gets built in this stage. The only output is paper. That is the point:
paper is cheap to change, and every hour saved here is three hours not spent
debugging a feature nobody asked for.

Run the blocks in order. Stop between each one.

---

## USE WHEN

- Starting a project or a feature big enough to touch more than two files.
- You have a one-line idea and no written scope.
- You keep adding "just one more thing" and the project never ships.

Skip this stage only for a single-file fix. Even then, write the one sentence
that defines done.

---

## BLOCK 1 — Idea intake

```
Help me plan a project. Do not write code. Do not design screens yet.

Ask me questions in small batches, a few at a time. Skip anything I already
answered. Stop asking once you have enough to write a short plan.

Cover:
- What it is: one or two sentences on the problem and the core idea.
- Who it is for: the actual user, not "everyone".
- Platform: website, web app, desktop, mobile, API only, or a mix.
- Core features: the must-haves for a first working version.
- Data: what is stored or handled. Flag anything sensitive (accounts, payments,
  personal data, files, health, children).
- Connectivity: offline, online, or hybrid. Ask me directly, offer the three
  options.
- Database: ask me directly, do not assume. Offer local (SQLite, file/JSON,
  IndexedDB) and cloud (Postgres, MongoDB, MySQL, Firebase) with one line of
  tradeoff each. If I say "not sure", recommend one based on my connectivity
  answer and give the reason in one line.
- Scale: personal project, MVP, or product with real paying users.
- Deadline or budget constraint, if any.

Default stack: React + TypeScript on the frontend, Node.js on the backend,
unless I ask for something else. State the default, do not make me choose.

Then summarize what you understood in 6 bullets and ask me to confirm.
```

**Note on scale.** "Personal project", "MVP", and "product with paying users" are
different sizes of project, not `MODE` values. Write the answer down; it decides
how much of this pack you run. If the answer is "product with paying users", you
will eventually run stages 05 and 06, and the architecture decisions here must
assume real users.

## BLOCK 2 — Short plan (the one-screen version)

```
Using the confirmed intake, write a short plan I can read in under a minute.

Include only:
1. Project summary: two lines. What it is, who it is for.
2. Stack: one line. Include the database choice.
3. Core features for v1: bullets only. Exclude anything that is not required to
   prove the product works.
4. Connectivity and data: one line each.
5. The riskiest assumption: what is most likely to make this fail or need a
   redesign, and what we would learn first.
6. Open questions: at most two, only if you genuinely cannot proceed.

Do not include architecture diagrams, milestones, or a security checklist yet.
Keep it under 25 lines.

Then ask: "Ship this scope, cut something, or add something?"
```

This is the cheapest possible place to catch a wrong direction. Read it and
argue with it.

## BLOCK 3 — PRD-lite

Only after the short plan is confirmed.

```
Write a PRD for this feature. Keep it under two pages. Be specific, no filler.
Save it as docs/prd-<feature-slug>.md.

Context: <paste the confirmed short plan>

Include:
1. Problem statement in three sentences. Why this, why now.
2. Success: two or three metrics or observable outcomes. How we know it worked.
3. Users and their top three jobs to be done.
4. User stories, each with acceptance criteria written as checks a stranger could
   perform by clicking. One line per criterion.
5. Scope: what ships in v1. Then a separate list titled "Not in v1" with a short
   reason for each exclusion.
6. Data model changes: entities, fields, relationships, and what is sensitive.
7. Edge cases and failure states: empty, loading, error, no permission, bad
   input, duplicate submit, offline, timeout.
8. Dependencies and unknowns.
9. Open questions for me, each with your recommended default.

Rules:
- No feature in v1 that is not required to prove the product works.
- Do not invent business facts, prices, legal claims, or user numbers. Mark them
  [VERIFY] and ask.
- Every acceptance criterion must be testable. "Fast" is not a criterion.
  "Search returns in under 300ms for 1,000 rows" is.
```

**Cutting is the skill.** A PRD with twelve v1 features is a PRD for a project
that will not ship. If v1 cannot be demoed in one sitting, cut again.

## BLOCK 4 — Spec (the source of truth)

Write the spec for one flow at a time.

```
Write an implementation spec for this flow. It becomes the source of truth, not
the code. Save it as docs/spec-<flow-slug>.md.

Flow: <name>
Context: <link to the PRD>
MODE: <prototype | staging | production>

Include:
1. Behaviour as Given / When / Then. Cover the happy path, every edge case, and
   every failure state. No "etc." and no "handle errors appropriately".
2. API contract: method, path, inputs with types and limits, outputs, error
   shapes, status codes. One example request and one example response.
3. Data: schema changes, migration, and the rollback.
4. UI states: loading, empty, success, error, unauthorised, and what the user
   sees and can do in each.
5. Permissions: who can do this, who cannot, and where that is enforced
   (server, not the UI).
6. Non-goals: what this spec deliberately does not cover.
7. Acceptance checklist: numbered lines, each independently verifiable.
8. Open questions.

Rules:
- Be exhaustive on failure. Most bugs live in the states nobody specified.
- If two behaviours are both reasonable, pick one, say why, and list the other as
  a future option.
- Do not write code.

The spec is binding: stage 2 implements exactly this spec. If reality forces a
deviation, stop, update the spec, get my approval, then continue.
```

**Why this works.** The spec is the artefact you point at when the agent drifts.
"Where is that in the spec?" is a shorter conversation than "why did you add
that?".

## BLOCK 5 — UI brief

Skip for API-only work. Run it before any screen gets built.

```
Create a UI/UX brief for this screen or flow. Save it as docs/ui-<slug>.md.

Screen: <name>
Audience: <who uses it, on what device>
Brand: <colours, fonts, or "none yet - propose a minimal system">
Reference products to study for direction: <two or three>. Never copy them.

Deliver:
1. User journey through the flow, step by step, including what happens on
   back/reload/abandon.
2. Layout per screen: hierarchy, spacing scale, grid, breakpoints.
3. Component inventory. Every component with every state: default, hover, focus,
   active, disabled, loading, empty, error, success.
4. Tokens: colour roles (not just hex), type scale, spacing scale, radius,
   shadow. Define them as variables I can paste into code.
5. Motion: what animates, duration, easing, and what must respect
   prefers-reduced-motion.
6. Accessibility: keyboard order, focus visibility, labels, contrast targets,
   what is announced on state change.
7. Copy: the actual words for buttons, empty states, and errors. Not placeholders.
8. What is deliberately cut for v1.

Target WCAG 2.2 AA. Do not claim conformance. Note what needs a real device or
screen-reader test.
```

---

## THE FULL SEQUENCE

```
BLOCK 1  intake            -> confirmed facts          [you confirm]
BLOCK 2  short plan        -> 25 lines, one screen     [you argue or accept]
BLOCK 3  PRD-lite          -> docs/prd-<feature>.md    [you approve scope]
BLOCK 4  spec (per flow)   -> docs/spec-<flow>.md      [you approve spec]
BLOCK 5  UI brief          -> docs/ui-<slug>.md        [you approve]
                                   |
                                   v
                        02-BUILD.md, one step at a time
```

Do not merge these into one mega-prompt. The value is in the four decision
points, not the writing.

---

## IT'S DONE WHEN

- `docs/prd-*.md` exists and has a real "Not in v1" list.
- `docs/spec-*.md` exists for the first flow, with a numbered acceptance
  checklist and specified failure states.
- `docs/ui-*.md` exists, or you deliberately skipped it because there is no UI.
- Every acceptance line is verifiable by someone who did not write it.
- Open questions are answered or explicitly parked.
- `MODE:` is written down.

## GATE

```
GATE — PLAN
Done:      scope confirmed, spec approved, `MODE` declared
Evidence:  docs/prd-<feature>.md; docs/spec-<flow>.md; docs/ui-<slug>.md
I need:    approval to start stage 2
Reply:     go   |   change the scope   |   stop
```

Do not proceed on a verbal "looks good" if you have unanswered questions. Those
questions become change requests later, at ten times the cost.

## COMMON FAILURES

- **Skipping the spec.** The most common cause of drift. Without it, every later
  decision is a negotiation.
- **The PRD as a wish list.** If v1 has everything you want, nothing is a
  priority, and the agent builds the interesting part first.
- **Unverifiable acceptance criteria.** "Works well" cannot be checked, so it
  will not be.
- **Designing in code.** Building screens before the states are defined
  guarantees the empty and error states get improvised.
- **No "Not in v1".** Without a written exclusion list, scope grows silently and
  nobody notices until the deadline.
- **Letting the agent plan and build in one message.** You lose the only cheap
  correction point.
