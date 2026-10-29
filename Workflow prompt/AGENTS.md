# AGENTS.md

This repository contains two standalone workflow packs. They are documentation,
not an application. Do not scaffold, install, or run anything unless the user asks.

## If the task is to build, plan, or ship something

Read `AI-Build-Workflow/START-HERE.md` and follow it.
Modes: `FULL`, `BUILD`, `FIX`, `LAUNCH`, `UPKEEP`.

## If the task is to audit an existing project

Read `AI-EXISTING-PROJECT/START-HERE.md` and follow it.
Lanes: `DEBUG`, `UI`, `DEAD-CODE`, `SECURITY`, `POLICY`, `LAUNCH`.
`FULL` runs all six in order; it is not a lane of its own.

## If the task is to build a supplied design

Read `AI-EXISTING-PROJECT/UI-IMPLEMENT.md` and follow it. This is a build task,
not an audit lane. Read the project and plan first, then wait for approval
before editing.

## Rules that apply to both

1. Load the stage or lane file yourself. Do not ask the user to paste prompts.
2. One stage or lane at a time. Print the gate block, then stop.
3. Evidence in every finding: `path:line`, a route and viewport, or command
   output. No location means no finding.
4. Statuses, only these: `PASS` / `FAIL` / `BLOCKED` / `NOT RUN` / `N/A`, plus
   `(code only)` when you only read code.
5. Severities, only these: `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` / `NEEDS-PROOF`.
6. Never fill a release status, verdict, or sign-off on the user's behalf.
7. Never say "ready", "secure", "safe", or "production-ready" about the project.
   The `DEAD-CODE` verdict `SAFE` and the shortcut `fix everything safe` are fixed
   terms, not claims.
8. If the user asks about these documents themselves, answer directly and do not
   start a workflow.

`CLAUDE.md` carries the same content for tools that read that filename.
