# 07 — UPKEEP

> **How to use — one line:**
> `Read AI-Build-Workflow/07-UPKEEP.md and apply it to this project.`
> The AI runs the blocks in order and stops at each gate. You only answer
> questions. No file access? Paste this whole file instead. Want manual control?
> Paste one block at a time.

**Run mode:** UPKEEP · **Produces:** tests that catch regressions, less code, a clean
history, automated guardrails, one reusable skill · **Gate:** build and tests
green after every deletion, and every guardrail fires when you break it on
purpose.

Shipping is the midpoint. This stage is what keeps the project from slowly
turning back into the mess you audited.

Run it after a release, at a fixed interval, or when the repo starts to feel
heavy.

---

## USE WHEN

- The repo feels slow, noisy, or scary to touch.
- You are about to refactor something important and want a safety net first.
- Your commits are called "fix", "fix2", "final".
- You have done the same task three times and explained it three times.
- It has been a month and nobody ran the dependency audit.

---

## BLOCK 1 — E2E tests (the safety net)

Do this **before** cleanup. You need the net before the trapeze.

```
Write end-to-end tests for these flows: <list>. MODE: <staging | production>.

Stack: <framework>   Runner: <Playwright | Cypress | other>   CI: <provider>

Rules:
1. Money paths first: signup, checkout or the core value action. In that order.
2. Test what the user sees and does, not implementation details. No assertions on
   internal state, class names, or component internals.
3. Select by role and accessible name. No brittle CSS chains, no nth-child, no
   test IDs unless there is no accessible option.
4. One unhappy path per flow: invalid input, network failure, expired session.
5. Tests are independent. Any order, zero shared state, each seeds its own data
   and cleans up.
6. Headless in CI, headed locally. Screenshots and traces on failure only.
7. No arbitrary sleeps. Wait on a real condition, with a timeout.
8. Every test must be able to fail. If you cannot describe the bug it would catch,
   delete it.

Then:
- Run the suite and show the results.
- Fix what fails, or explain why the test was wrong.
- Tell me what the suite still does NOT cover.
```

A suite that has never failed has never tested anything. Break one assertion on
purpose and confirm the run goes red.

## BLOCK 2 — Dead code

```
Find and remove dead code. Scope: <whole repo | specific folder>.

Look for:
- Unused exports, components, hooks, utilities, types.
- Unreachable branches, commented-out blocks, disabled features.
- Dependencies in the manifest that nothing imports.
- Stale feature flags stuck always-on or always-off.
- Duplicate logic that should be one implementation.
- Dead styles, unused assets, unused routes.

Before EVERY deletion:
1. Search for dynamic imports, string references, route tables, and config that
   could reference it by name. Grep the identifier, not just the file.
2. Confirm it is not part of a public API or a documented extension point.
3. Delete in small batches, each with a passing build and test run.
4. Record: file, lines removed, how you verified it was unused.
5. If you are less than certain, leave it and list it separately as "suspected
   dead, needs owner confirmation".

Report: total lines removed, dependencies removed, and everything you were not
100% sure about.
```

**The trap:** your editor greys out an import, and it looks dead. But a route
table, a plugin loader, or a string reference still points at it. Search first,
delete second.

## BLOCK 3 — Commit craft

Git safety rules are in `00-RULES.md` §8. This is how to write the history.

```
Prepare the staged changes for commit.

Convention: <Conventional Commits | team format>
Ticket prefix: <TICKET-ID or none>

1. Split unrelated changes into separate commits. A refactor and a behaviour
   change never share a commit. A formatting pass never shares with a feature.
2. Message format: type(scope): summary
   Types: feat, fix, refactor, perf, test, docs, chore, build, ci.
3. Subject: imperative mood, under 50 characters, no trailing period.
   "add retry to payment webhook", not "added retries" or "fixing stuff".
4. Body, wrapped at 72: explain WHY, not what. The diff already says what.
5. Reference the ticket in the body if there is one.
6. Never commit secrets, .env files, build output, or generated files.
7. Never add a co-author trailer unless I ask.

First show me the plan: commit | files | message. Wait for approval. Then commit
one at a time so I can stop you between them.
```

## BLOCK 4 — Guardrails (automate the rules)

Every rule that gets forgotten needs a machine that remembers it. Rules that live
only in a document get skipped under deadline.

```
Set up automated guardrails for this project. Stack: <stack and package manager>.

1. Pre-commit hook: format and lint the staged files, and typecheck. Fail with a
   clear message naming the file and the fix.
2. Pre-push or CI: run the full test suite and the production build.
3. Protected paths: block commits that touch migrations, .env, production config,
   or generated lockfiles unless the message includes a deliberate marker.
4. Secret scan: block any commit containing something that looks like a key.
5. CI: run the same checks on every pull request, plus the dependency audit.
6. Keep each hook script under 20 lines. No clever abstractions. Exit non-zero
   with a message a human can act on.

Then prove each one fires: make a deliberate violation and show the failure
output. A guardrail nobody has seen fire is a guardrail that does not work.

Tell me which checks belong locally (fast, per commit) and which belong in CI
(slow, per pull request).
```

Prefer fast local checks and slow CI checks. A pre-commit hook that takes 40
seconds gets disabled by everyone within a week.

## BLOCK 5 — Turn a repeated task into a skill

```
Turn this repeated task into a reusable instruction file.

The task: <describe it>
Steps I actually take: <list them, in order>
What I decide myself vs what should be asked: <list>

Create <path your tool uses for saved skills or slash commands>.

Include:
1. Name and description written with the exact phrases I use when I want this
   task. The trigger matters more than the title.
2. The numbered workflow, in the order I really do it.
3. My conventions and preferences for this task.
4. Edge cases and what to do about them.
5. What to ask me vs what to infer.
6. What "done" looks like, as checkable lines.

Then dry-run it on a real example and show me the output. We refine until the
output matches what I produce by hand. If it does not match, the skill is not
finished.
```

The test is comparison, not description. A skill that produces something
different from your manual result is a draft.

---

## MAINTENANCE CALENDAR

| Cadence | Task |
|---|---|
| Every commit | Guardrails run; message follows the convention |
| Every release | E2E suite green; re-run `05-AUDIT.md` with the `re-audit` shortcut |
| Monthly | Dependency audit read, not just run; dead-code pass; accepted risks reviewed |
| Quarterly | Restore a backup; review access and keys; check spend against caps |
| Whenever you repeat yourself | Turn it into a skill (block 5) |

---

## IT'S DONE WHEN

- The E2E suite covers the money paths and runs in CI.
- One test has been deliberately broken to prove the suite can fail.
- Dead code is removed in small commits, and build plus tests are green after
  each one.
- Every dependency removed from the manifest is also gone from the lockfile.
- The commit history reads as a sequence of reasons, not a sequence of guesses.
- Every guardrail has been triggered on purpose, with output shown.
- One repeated task exists as a skill, and its dry-run matched your manual result.

## GATE

```
GATE — UPKEEP
Done:      <n> lines removed, <n> dependencies removed, suite green
Evidence:  <n> guardrails fired on purpose; skill `<name>` dry-run matched
I need:    re-audit now or later
Reply:     re-audit   |   later   |   stop
```

## COMMON FAILURES

- **Cleanup before tests.** You cannot tell a deletion from a breakage.
- **Deleting by greying-out.** Editors do not see string references or dynamic
  imports.
- **Giant commits.** One commit, 40 files, "various fixes". Nobody can review it,
  and nobody can revert it.
- **Guardrails that are too slow.** The team disables them, and now you have no
  guardrails and a false sense of one.
- **Skills that describe rather than reproduce.** If the dry-run output differs
  from yours, the instructions are wrong.
- **One-off dependency upgrades.** A major upgrade mixed into a feature branch
  turns a bug hunt into an archaeology project.
