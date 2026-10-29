# DEAD CODE — find what is unused and remove it safely

> **How to use — one line:**
> `Read AI-EXISTING-PROJECT/DEAD-CODE.md and apply it to this project.`
> The AI runs the phases in order and stops at each gate. No file access? Paste
> this whole file instead.

Dead code is code that no path can reach: unused files, exports, dependencies,
assets, styles, routes, flags, and environment variables. It costs review time,
hides real bugs, and makes every future change look riskier than it is.

This lane finds it, proves it is unreachable, and removes it in small batches
that keep the build green. It is not a refactor and not a rewrite.

---

## RULES

1. Detection is read-only. Do not run builds, tests, package managers, or the app
   until I approve commands, and do not delete anything until I approve specific
   IDs.
2. "Unused" is a claim that needs proof: static search, entry-point analysis,
   and dynamic-reference checks. A single grep is not proof.
3. Never delete a migration, seed, fixture, or historical record.
4. Never delete a public API surface, an exported SDK symbol, a documented
   extension point, or a webhook handler.
5. Never delete a test to make a suite green. If code is dead, delete its test
   with it and say so.
6. Framework conventions override grep. File-based routing, autoloading,
   dependency injection, plugin folders, glob imports, and config-driven
   registration all look unused to a text search.
7. Generated files are not dead code. Check `.gitignore` and the generator.
8. One category per batch. Build and test after every batch.
9. No behaviour changes in this lane. If live code is inefficient, report it as
   a finding for another lane, do not rewrite it here.
10. Preserve uncommitted work. Never revert changes that are not yours.
11. If a dependency is unused in code but required by tooling or policy, mark it
   `KEEP` with the reason.
12. Record a rollback point before the first deletion.

---

## PHASE 1 — STACK AND TOOLS

Detect from the repo:

- Language, framework, bundler, compiler, test runner, linter.
- Package manager and lockfile. Use the real one.
- Framework routing and registration conventions.
- Available dead-code tooling already installed: `knip`, `depcheck`, `ts-prune`,
  `unimported`, `vulture`, `deadcode`, coverage reports, compiler flags.

Use what is installed. Do not install a new tool without a one-line reason and my
approval. No tool available means manual analysis, which is slower but valid.

**Output:** the tool list, and which categories you can prove and cannot.

## PHASE 2 — CANDIDATES

Collect, with locations:

- Commented-out blocks and abandoned `TODO` stubs.
- Files no entry point, route, test, or config reaches.
- Exports, types, and constants with no consumer.
- Dependencies and devDependencies not referenced in code or config.
- Images, fonts, icons, video, and sample data not referenced in code, CSS, or
  content.
- CSS selectors, classes, variables, and tokens never applied.
- Environment variables read nowhere, or declared but unused.
- Routes, endpoints, jobs, and cron entries not called.
- Feature flags permanently on or off, and the dead branch behind them.
- Duplicate utilities, legacy aliases, and superseded implementations.
- Build scripts and config files replaced by a newer one.

Do not classify yet. Collect first.

## PHASE 3 — PROVE

For each candidate, before any deletion:

1. Search the exact symbol, file path, extensionless path, and case variants.
2. Search dynamic patterns: string concatenation, template literals, `require` or
   `import` with a variable, glob imports, reflection, dependency injection,
   config maps, database-driven routes, CMS content, CSS class strings in JS.
3. Check entry points: HTML, server bootstrap, route manifests, worker files,
   CLI entries, test setup.
4. Check build config: aliases, globs, copy steps, externals.
5. Check tests, stories, docs, and example folders.
6. Check external consumers if this is a library, package, or public API.
7. In a monorepo, check sibling packages, workspace config, and shared build
   pipelines before deleting anything.
8. Check git history only for context, never as proof of use.

Classify:

| Verdict | Meaning | Action |
|---|---|---|
| `SAFE` | No reachable reference, no dynamic pattern, no external contract | Delete after approval |
| `LIKELY SAFE` | No reference found, but a runtime or external path cannot be checked | List separately, delete only on explicit approval |
| `KEEP` | Referenced, convention-loaded, generated, or part of a contract | Keep, with the reason |

## PHASE 4 — FINDINGS

Use only these levels. For dead code, severity measures risk
of keeping it, not risk of deleting it.

| Level | Meaning |
|---|---|
| `CRITICAL` | The dead path hides a security or data-flow problem, or a duplicate still runs in production. |
| `HIGH` | A large unreachable surface, or a route users can still reach, that blocks review. |
| `MEDIUM` | Unused module, export, asset, or dependency with real maintenance cost. |
| `LOW` | Commented code, unused style, or a small asset. |
| `NEEDS-PROOF` | Looks unused, but a dynamic or external path cannot be checked. |

```
DEAD-01
Verdict:     SAFE
Category:    unused file
Location:    src/legacy/formatDate.ts  (88 lines, 0 references)
Evidence:    no import; not in route manifest; not in build globs; no test.
Risk if kept: Confusing duplicate of src/lib/date.ts:12.
Action:      delete file and its barrel export.
```

`DEAD-02` for a dependency lists the manifest line, the lockfile entry, and every
config that does or does not reference it.

## PHASE 5 — REMOVE

If no finding IDs have been approved yet, delete nothing. Go to Phase 7, write the
report, and print the gate.

Only approved IDs. Work in this order, one batch at a time:

1. Commented-out code.
2. Unused assets, then unused styles.
3. Unused exports and types.
4. Unused files.
5. Unused dependencies and devDependencies.

Before the first deletion, capture the baseline with the same commands you will
use at the end: build, typecheck, lint, tests, bundle size, and the current
commit. Without it, you cannot show what the cleanup changed.

Rules for each batch:

- Delete the smallest coherent unit.
- Update the imports that pointed at it. Do not rewrite the surrounding logic.
- Remove the orphan test with its code, and say so in the report.
- Remove a dependency with the project's real package manager so the lockfile
  stays consistent. Never hand-edit a lockfile.
- After the batch: build, typecheck, lint, run the tests, start the app.
- If anything fails, revert that batch only and re-classify it.

Never mix two categories in one batch. Never mix a deletion with a feature.

## PHASE 6 — VERIFY

Compare against the baseline you captured before the first deletion.

| Check | Command or method | Status | Evidence |
|---|---|---|---|
| Build | | | |
| Typecheck | | | |
| Lint | | | |
| Unit tests | | | |
| Integration / E2E | | | |
| App starts | | | |
| Primary routes respond | | | |
| Bundle size, before / after | same command both times | | |
| Dependency tree valid | | | |
| Diff reviewed, no behaviour change | | | |

Statuses, only these: `PASS` · `FAIL` · `BLOCKED` · `NOT RUN` · `N/A`.
Add `(code only)` when you only read code.

A green build is not proof that a deleted route was unused. Exercise the primary
routes and state what you could not reach.

## PHASE 7 — REPORT

1. **Summary.** Categories inspected, files deleted, dependencies removed, lines
   removed, assets removed.
2. **Findings table.** ID | verdict | category | location | status.
3. **Changes.** Every path deleted or edited, grouped by batch, with the reason.
4. **Verification table** from Phase 6.
5. **Bundle and dependency delta.** Same command, before and after.
6. **Kept list.** Every `KEEP` and `LIKELY SAFE` item with its reason.
7. **Rollback.** The commit or patch that restores each batch.
8. **Assessment.** Exactly one of: `VERIFIED FOR TESTED SCOPE`,
   `PARTIALLY VERIFIED`, `NOT VERIFIED`.
9. **Save it.** Write the report to `docs/audit-<YYYY-MM-DD>-dead-code.md` before
   the gate. If the project forbids new files, say so and print the report.

Never claim the repo is clean. Say what was removed, what was proven, and what
remains unproven.

---

## IT'S DONE WHEN

- Every deletion has a `SAFE` verdict and evidence, not an assumption.
- Every batch has its own verification result.
- The kept list explains each rejected deletion.
- Bundle and dependency numbers come from the same command, before and after.
- Rollback is written down and tested at least once.
- Remaining candidates are listed, not silently dropped.

## GATE

```
GATE — DEAD CODE
Done:      <phases completed>
Findings:  CRITICAL _ HIGH _ MEDIUM _ LOW _ NEEDS-PROOF _
Verdicts:  SAFE _ LIKELY SAFE _ KEEP _
Evidence:  <counts, verification summary, bundle delta>
I need:    which batches to delete now
Reply:     delete DEAD-01, DEAD-04   |   delete all SAFE   |   stop
```

## COMMON FAILURES

- **Grep as proof.** Dynamic imports, globs, DI, and config maps defeat it.
- **Deleting framework magic.** Next.js `app/`, Rails autoload, Django app
  registry, Spring scanning, Vite glob imports.
- **Deleting migrations.** They look unused and are history.
- **One giant commit.** When the build breaks, nothing can be isolated.
- **Deleting the test with the code, silently.** Say it in the report.
- **Lockfile by hand.** Use the package manager or the tree drifts.
- **Optimising live code.** That is a different lane with different approval.
- **Trusting 100% coverage as a safety net.** Dead code is often untested by
  definition.
