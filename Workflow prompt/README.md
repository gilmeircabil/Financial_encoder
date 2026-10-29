# Which folder do I use?

**Starting something new?** → `AI-Build-Workflow`

```
Read AI-Build-Workflow/START-HERE.md and apply it to this project.
```

**Have a project already, and want it audited?** → `AI-EXISTING-PROJECT`

```
Read AI-EXISTING-PROJECT/START-HERE.md and apply it to this project.
```

That is the whole decision. One folder plans and builds. The other finds what is
broken, improves the interface, removes dead code, and audits security, policy,
and launch readiness in code that already exists.

| | `AI-Build-Workflow` | `AI-EXISTING-PROJECT` |
|---|---|---|
| For | New project, new feature | Existing codebase |
| Starts with | Plan, then build | Read-only audit |
| Ends with | Signed release | Signed release |
| Stages | 00 rules, 01 plan, 02 build, 03 connect, 04 debug, 05 audit, 06 ship, 07 upkeep | Debug, UI, dead code, security, policy, launch |
| Typical command | `START-HERE.md` | `START-HERE.md` |

Both use the same rules: evidence with `file:line`, one severity scale, one status
scale, and a gate before anything is edited.

The audit kit also carries one task file, `AI-EXISTING-PROJECT/UI-IMPLEMENT.md`,
for building a supplied design into an app that already exists. It is not a lane,
and `FULL` never runs it.

Being audited by someone else? Send them `AI-EXISTING-PROJECT`. Building with an
AI? Use `AI-Build-Workflow`.

---

## The words, once

These are the words that get mixed up. They mean different things.

| Word | Where | Meaning |
|---|---|---|
| Pack | both | One folder you copy into a project |
| Stage | build | One numbered file, e.g. `01-PLAN.md` |
| Lane | audit | One job, e.g. `SECURITY` or `DEAD-CODE` |
| Mode | build | `FULL`, `BUILD`, `FIX`, `LAUNCH`, `UPKEEP` — how much of the pack runs |
| `MODE` | build only | `prototype`, `staging`, or `production` — the environment, declared once per session |
| Shortcut | both | An extra word that narrows one file, e.g. `security only` or `re-audit` |
| Gate | both | A stop with exactly one decision for you |
| Finding ID | both | `PLAN-01`, `DBG-04`, `UI-02`, `DEAD-03`, `SEC-07`, `POL-01` |
| Verdict | both | `NOT READY`, `NOT FULLY VERIFIED`, `VERIFIED FOR TESTED SCOPE`, `PARTIALLY VERIFIED`, `NOT VERIFIED` |
| Dead-code verdict | audit `DEAD-CODE` | `SAFE`, `LIKELY SAFE`, or `KEEP` for one item, with evidence |

`MODE` is not a stage. A run mode is not a stage. A lane is not a stage. A
shortcut is neither. The audit kit has no `MODE`: it has lanes and shortcuts.

## Version

`v1.4` — 29 October 2026. 22 files: 12 in `AI-Build-Workflow`, 7 in
`AI-EXISTING-PROJECT`, plus this `README.md`, `AGENTS.md`, and `CLAUDE.md`.

v1.4 is a consistency pass, not a feature: fixed the contradictions found in
review. `05-AUDIT` and `06-SHIP` now print the canonical gate block before any
stage opens. `re-audit` no longer assumes a previous report exists. The
`DEAD-CODE` verdict `SAFE` is allowed without weakening the ban on claiming a
project is safe. `FULL` is no longer listed as an audit lane. Run mode
(`FULL`/`BUILD`/`FIX`/`LAUNCH`/`UPKEEP`) is now separate from `MODE`
(`prototype`/`staging`/`production`).

Earlier: v1.3 added `AI-EXISTING-PROJECT/UI-IMPLEMENT.md`, a task file for
building a supplied design into an existing app. v1.2 added the small-change path
to `02-BUILD.md`, a six-line micro-spec that replaces Blocks 1–2 for
one-behaviour changes. v1.1 added the LAUNCH risk register, the `re-audit` delta,
jurisdiction questions for POLICY, and a git-history secret check for SECURITY.

When you change a status scale, a severity level, or a gate rule, bump the
version here and write one line about what changed.
