# AI BUILD WORKFLOW

A stage-based method for building real software with an AI coding agent.
One file per stage. Read only the stage you are in.

**Version 1.4 · Tool-neutral · Works with Claude Code, Cursor, Copilot, Codex, Windsurf, or a plain chat window.**

---

## 1. The idea in one paragraph

Most people lose control of AI-assisted builds because they hand over the whole
project at once, then cannot tell whether the output is correct. This workflow
fixes that with three things: a **rules file** the agent always follows, a
**stage** you read one at a time, and a **gate** you must pass before moving on.
Every stage produces an artifact you can show someone. No stage ends with
"trust me".

---

## 2. The map

```
                        00-RULES.md
                (always loaded, never optional)
                              |
        +---------------------+---------------------+
        |                     |                     |
      BUILD                 FIX                  LAUNCH
        |                     |                     |
   01 PLAN  ---------->  04 DEBUG  ---------->  05 AUDIT
        |                                           |
   02 BUILD                                          |
        |                                           v
   03 CONNECT  ----------------------------->  06 SHIP
                                                    |
                                                    v
                                              07 UPKEEP
                                              (loops back to 01)
```

Five modes. Pick the mode that matches what you are doing right now:

| Mode | You are here when | Stages |
|---|---|---|
| **FULL** | New project, from empty folder to signed release | 00 → 01 → 02 → 03 → 05 → 06 |
| **BUILD** | Starting something new, or adding a feature | 00 → 01 → 02 → 03 |
| **FIX** | Something is broken | 00 → 04 |
| **LAUNCH** | It works and real users are next | 00 → 05 → 06 |
| **UPKEEP** | It is live, or the repo is getting heavy | 00 → 07 |

You never read a stage you are not in. That is the whole point.

---

## 3. Files

| File | Mode | Produces | Gate |
|---|---|---|---|
| `START-HERE.md` | all | Drives the whole workflow from one paste | You answer the gates |
| `00-RULES.md` | all | `PROJECT.md` + the rules the agent obeys | Rules loaded, repo scanned |
| `01-PLAN.md` | BUILD | `docs/prd-*.md`, `docs/spec-*.md`, `docs/ui-*.md` | Plan + spec approved by you |
| `02-BUILD.md` | BUILD | Working code, one verified step at a time. A six-line micro-spec handles one-behaviour changes without the full plan | App runs after every step |
| `03-CONNECT.md` | BUILD | Database, env vars, integrations | Seed-and-read proof shown |
| `04-DEBUG.md` | FIX | Root cause + fix + regression test | Failing test now passes |
| `05-AUDIT.md` | LAUNCH | Evidence-backed audit report, verdict | You read the report and approve |
| `06-SHIP.md` | LAUNCH | Verified fixes, gate checklist, sign-off | Human signs the release |
| `07-UPKEEP.md` | UPKEEP | Less code, clean history, guardrails | Build + tests green |

`_reference/` holds the original long-form documents this pack was built from.
Use them when you need the full checklist, not as daily reading.

---

## 4. How to use it

### Way 1 — one line (start here)

Put the `AI-Build-Workflow` folder in your project. Then say this, and nothing
else:

```
Read AI-Build-Workflow/START-HERE.md and apply it to this project.
```

That is the full command. The AI opens the file, opens the stage files it needs
from the same folder, runs them, and stops at each gate. You never paste a prompt.

If your tool reads `AGENTS.md` or `CLAUDE.md` from the project root, put one there
and point it at this pack. It loads without the line. The workspace-level copies
in this repo are a working example.

You reply with short decisions: `yes`, `go`, `1`, `cut X`, `fix AUD-01`.
If you get lost, type `where are we?`.

Every file works the same way, so you can jump straight to one stage:

| Goal | Say |
|---|---|
| Whole workflow | `Read AI-Build-Workflow/START-HERE.md and apply it to this project.` |
| Plan only | `Read AI-Build-Workflow/01-PLAN.md and apply it to this project.` |
| Build only | `Read AI-Build-Workflow/02-BUILD.md and apply it to this project.` |
| One small change (add a button, hide a section) | Same line, then answer the six-line micro-spec. No plan stage. |
| Fix one error | `Read AI-Build-Workflow/04-DEBUG.md and apply it to this project.` |
| Audit before launch | `Read AI-Build-Workflow/05-AUDIT.md and apply it to this project.` |
| Ship after audit | `Read AI-Build-Workflow/06-SHIP.md and apply it to this project.` |
| Clean up the repo | `Read AI-Build-Workflow/07-UPKEEP.md and apply it to this project.` |

**If your tool cannot read files** (a plain chat box), paste the whole stage file
instead. That is one paste per stage, not one per block.

### Way 2 — manual, block by block

Use this when you want direct control over every step.

#### The first 30 minutes

1. Open `00-RULES.md`. Paste **Block 1** into your agent. Save the output as
   `PROJECT.md` in your repo root.
2. Paste **Block 2** so the agent states its mode and constraints.
3. Open `01-PLAN.md`. Run **Block 1** (intake). Answer the questions.
4. Stop. Read the short plan. If it is wrong, say what is wrong. Do not let the
   agent build yet.

That is it. You now have the same starting position a professional team has:
written rules, a confirmed scope, and an agent that has not touched code.

### The three ways people take this course

- **Solo build.** Follow 00 → 01 → 02 → 03. Ship with 05 → 06. Come back for 07.
- **Rescue an existing project.** Skip to `05-AUDIT.md`, run it read-only,
  then `06-SHIP.md`. Use `04-DEBUG.md` for anything broken along the way.
- **Team rollout.** Everyone uses `00-RULES.md` and `05-AUDIT.md` verbatim so
  reviews compare like with like. Stages 01–03 stay personal.

---

## 5. The seven conventions that hold this pack together

These are repeated in every stage file on purpose. Learn them once.

**1. `MODE` is always declared.**
Every session starts with `MODE: prototype | staging | production`.
Prototype means "it works end to end". Staging means "it is safe for real
testers". Production means "real users, real money, real data". The same code
gets different rules per `MODE`, and saying which one you are in prevents the
most common contradiction in AI builds: planning for a prototype while
applying production rules, or the reverse. A run mode (`FULL`, `BUILD`, `FIX`,
`LAUNCH`, `UPKEEP`) decides how much of the pack runs. `MODE` decides which rules
apply.

**2. One severity scale.**

| Level | Meaning | Blocking? |
|---|---|---|
| `CRITICAL` | Data leak, auth bypass, data loss, payment bug, unbounded cost, unusable app | Always |
| `HIGH` | Core flow broken, serious permission gap, missing legal notice | Always |
| `MEDIUM` | Noticeable bug, workaround exists | Before launch |
| `LOW` | Polish, cleanup | Never |
| `NEEDS-PROOF` | Cannot be decided by reading; must be run or checked | Before launch |

If you are torn between two levels, pick the higher one and say why.

**3. One status scale.**

| Status | Meaning |
|---|---|
| `PASS` | Checked and correct. Add `(code only)` if you only read the code. |
| `FAIL` | Checked and broken. |
| `BLOCKED` | Could not check. Say exactly what is missing. |
| `NOT RUN` | Not attempted. |
| `N/A` | Does not apply. Give a one-line reason. |

Never write "works" without one of these. Never write `PASS` if you did not
actually check. A finding record also has a lifecycle (`open`, `fixed`, `stale`,
`accepted risk`). That is not a check status.

**4. One ID scheme.**
Findings are numbered per stage: `PLAN-01`, `BUILD-03`, `CONN-02`, `DBG-04`,
`AUD-11`, `SHIP-02`, `UPK-05`. Stable IDs mean you can say "fix `AUD-11`" and
everyone knows what that is.

**5. Evidence or it is not a finding.**
Every claim needs `path/to/file.ext:line` or a page/element/URL, plus a short
quote. No evidence means it is a guess, and guesses go in a separate section
labelled as such.

**6. Gates are real.**
Each stage ends with `STOP` and a question you must answer. The agent does not
self-approve. You approve.

**7. One report shape.**
End of task, always:

```
COMPLETED:   what changed, in plain language
FILES:       paths touched
VERIFICATION: command or check | PASS/FAIL/BLOCKED/NOT RUN/N/A | evidence
LIMITATIONS: what was not checked, what is uncertain
NEXT:        the single next action, or "awaiting your approval"
```

Nothing else. No summary of what you already know. No "great question".

---

## 6. Course outline (8 lessons)

Each lesson is self-contained. Objective, artifact, exercise, pass check, and
the mistake almost everyone makes.

### Lesson 0 — Setup (30 min)
**Objective:** Give the agent permanent, project-specific rules.
**Artifact:** `PROJECT.md` committed to the repo.
**Exercise:** Run `00-RULES.md` Block 1. Delete every line that is not true of
*this* repo. Add three "gotchas a new engineer hits in week one".
**Pass check:** A new contributor could start work from `PROJECT.md` alone.
**Common mistake:** Letting the agent write generic advice ("write clean code").
Rules that are not specific to your repo are noise.

### Lesson 1 — Plan (60 min)
**Objective:** Turn a vague idea into a scope you can defend.
**Artifact:** PRD-lite, spec with an acceptance checklist, UI brief.
**Exercise:** Write the PRD. Then cut v1 until it is uncomfortable. Then write
the spec for one flow only.
**Pass check:** Every acceptance line is something a stranger could verify by
clicking. You can name what you deliberately excluded.
**Common mistake:** Treating the spec as documentation written after the code.
It is the source of truth. If reality forces a change, the spec changes first.

### Lesson 2 — Build (90 min)
**Objective:** Ship working code in verified increments.
**Artifact:** A running app, one approved step at a time.
**Exercise:** Get a plan with 2–3 options and a rollback for each. Approve one.
Build step 1 only. Verify. Then step 2.
**Pass check:** The app runs after every single step, and you have evidence for
each one.
**Common mistake:** "Build the whole thing, I'll review at the end." You will
get a demo that looks right and breaks in the third click.

### Lesson 3 — Connect (45 min)
**Objective:** Add persistence and outside services without leaking secrets.
**Artifact:** Migrations with rollbacks, `.env.example`, one proven query path.
**Exercise:** Connect the database. Seed one row. Read it back. Show the output.
**Pass check:** You can roll the migration back, and no key ships to the browser.
**Common mistake:** A working connection treated as a working feature. Also:
committing `.env`, or putting a service-role key in frontend code.

### Lesson 4 — Debug (45 min)
**Objective:** Fix causes, not symptoms.
**Artifact:** A regression test that fails before the fix and passes after.
**Exercise:** Feed a real stack trace. Demand three ranked hypotheses, each
proven or killed with evidence.
**Pass check:** The test fails on the old code. The same pattern is searched for
elsewhere in the repo.
**Common mistake:** Accepting "fixed" without a reproduction. Also: making the
error disappear by disabling a lint rule or catching and ignoring.

### Lesson 5 — Audit (60 min)
**Objective:** Find what you cannot see because you wrote it.
**Artifact:** Read-only audit report with a verdict.
**Exercise:** Run the audit with the `audit only` shortcut. Insist on file coverage
numbers and file:line evidence.
**Pass check:** Every finding has a location. Every skipped area is listed. The
verdict is `NOT READY` or `NOT FULLY VERIFIED`, never "ready".
**Common mistake:** Letting the agent edit during the audit. Read-only first,
always. Mixed audit-and-fix hides what was actually inspected.

### Lesson 6 — Ship (45 min)
**Objective:** Replace "it works on my machine" with evidence.
**Artifact:** Fixed findings, gate checklist, a human signature.
**Exercise:** Fix only approved IDs. Re-run checks. Fill the sign-off table.
**Pass check:** Rollback is tested, backup is restored, secrets are in env, and
a named human signed.
**Common mistake:** Deploying on a green build with no runtime test and no
restore rehearsal.

### Lesson 7 — Upkeep (30 min)
**Objective:** Stop the codebase from rotting and stop repeating yourself.
**Artifact:** Cleaner repo, automated guardrails, one saved skill.
**Exercise:** Delete dead code with a search before every deletion. Set one
pre-commit check. Turn a task you have done three times into a saved prompt.
**Pass check:** Build and tests are green after each deletion, and the guardrail
fires when you break it on purpose.
**Common mistake:** Deleting based on an editor's grey-out. Dynamic imports and
string references do not show up there.

---

## 7. Glossary

- **Agent** — the AI tool writing or reviewing code.
- **Stage** — one file in this pack; you read one at a time.
- **Gate** — the explicit stop where you approve before the agent continues.
- **Mode** — how much of this pack runs: `FULL`, `BUILD`, `FIX`, `LAUNCH`, or
  `UPKEEP`.
- **`MODE`** — the environment: `prototype`, `staging`, or `production`. Changes
  which rules apply. Declared once per session, separately from the mode.
- **Artifact** — the file or output a stage must produce.
- **Finding** — a specific, evidenced problem with an ID and severity.
- **Acceptance checklist** — verifiable lines that define "done".
- **Code-traced** — verified by reading code, not by running it.
- **NEEDS-PROOF** — cannot be settled without running something or checking an
  external dashboard.
- **Rail** — a rule that cannot be traded away (never commit secrets, never
  claim unverified success).

---

## 8. What changed from the source material

This pack is a restructure, not a rewrite. Provenance:

| New file | Built from |
|---|---|
| `00-RULES.md` | The original AI rules document + the repo-scan prompt + one merged report format |
| `01-PLAN.md` | The original planning workflow, steps 1–3 + the PRD, spec, and design-brief prompts |
| `02-BUILD.md` | Planning step 4 + the plan-mode and implementation-plan prompts + engineering rules §2 |
| `03-CONNECT.md` | The MCP and database prompts + engineering rules §5, §6 |
| `04-DEBUG.md` | The original debugging workflow, all 8 phases |
| `05-AUDIT.md` | The original audit workflow + `_reference/MASTER_LAUNCH_AUDIT_COMBINED.md` |
| `06-SHIP.md` | Audit workflow phases 5–7 + master §7.2/§7.3 |
| `07-UPKEEP.md` | The dead-code, commit, hooks, and skill prompts + engineering rules §2, §13 |

The six source documents were archived and then removed once their content was
folded in. See `_reference/README.md` for what moved where and where the archive
lives.


Defects fixed in the process:

1. **One audit entry point.** The old set had two overlapping audit workflows.
   `05-AUDIT.md` absorbs the modes and approval wording; the long checklist is
   reference material, not a second workflow.
2. **One severity scale** (was P0–P4, CRITICAL/HIGH/MEDIUM/LOW, and prose).
3. **One status scale** (was three different vocabularies).
4. **One report format** (was four).
5. **Security written once.** Tiered baseline in `00-RULES.md` §7; other files
   reference it instead of restating it.
6. **Prototype/production continuity.** The `MODE` variable now travels through
   planning, build, and audit, so the documents stop contradicting each other.
7. **Broken references fixed.** The old engineering rules pointed at
   `4 MASTER_LAUNCH_AUDIT_COMBINED.md` and `SECURITY_AUDIT_PLAYBOOK.md`, neither
   of which existed under those names.
8. **Naming fixed.** `CLaude.md`, `FInal-Debugging`, `Launch-emplement` are gone.

Three gaps in the original prompt collection are now covered for the first time: UI/UX
design brief, Playwright E2E testing, and dead-code cleanup. Two gaps were
merged into existing stages rather than given their own: commit craft lives in
`07-UPKEEP.md`, hooks and skills too.

---

## 9. Rules for teaching this to others

- Teach the **gate**, not the prompt. The prompt is replaceable; the habit of
  stopping is not.
- Show a **failure** first. Let the agent hallucinate a file path, then point at
  `00-RULES.md` §5. It lands better than any slide.
- Never demo a whole build in one prompt. It teaches the wrong reflex.
- Give learners the checklists, not just the outcomes. They need to know what
  "done" looks like at each stage.
- Say "this finds problems" not "this makes it safe". The workflow reduces
  risk; it does not certify anything.
