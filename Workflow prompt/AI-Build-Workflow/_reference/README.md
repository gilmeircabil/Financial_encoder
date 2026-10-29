# Reference material

One file remains here on purpose: the checklist library that `05-AUDIT.md` calls
directly.

| File | Used by | Why it is kept |
|---|---|---|
| `MASTER_LAUNCH_AUDIT_COMBINED.md` | `05-AUDIT.md` Phase 1–4 | The full item-by-item checks for S1–S23, site-type modules, stack-specific checks, severity and confidence definitions, and the policy templates in the appendix. |

## What was removed and where it went

Six long-form source documents were deleted once their content was folded into
the staged files. They were duplicates: every rule, prompt, and phase now lives in
`00-RULES.md` through `07-UPKEEP.md`. Paths in this table are in the pack root,
one folder above this one.

| Removed | Now lives in |
|---|---|
| Original AI rules document | `00-RULES.md` |
| Original planning workflow | `01-PLAN.md` |
| Original engineering rules | `02-BUILD.md`, `03-CONNECT.md`, `00-RULES.md` §7 |
| Original audit workflow | `05-AUDIT.md`, `06-SHIP.md` |
| Original debugging workflow | `04-DEBUG.md` |
| Original 15-prompt collection | `01-PLAN.md`, `03-CONNECT.md`, `07-UPKEEP.md` |

An archive of the full pack before cleanup is at:

```
C:\Users\gilmi\AppData\Local\Temp\opencode\AI-Build-Workflow-full-2026-10-28.zip
```

The pre-restructure originals are at:

```
C:\Users\gilmi\AppData\Local\Temp\opencode\Workflow-prompt-originals-2026-10-28.zip
```

The temp folder is not permanent storage. Copy both zips somewhere you control if
you want to keep the history.

## Defects in the source material, fixed in the staged files

Keep this list so the same problems do not come back when you edit the pack.

1. Two overlapping audit workflows. `05-AUDIT.md` is now the only entry point.
2. Three severity scales and three status vocabularies. Use the ones in
   `00-RULES.md`.
3. Four different report formats. Use the one in `00-RULES.md` §9.
4. Dangling references to `4 MASTER_LAUNCH_AUDIT_COMBINED.md` and
   `SECURITY_AUDIT_PLAYBOOK.md`. Neither file exists. The correct target is
   `MASTER_LAUNCH_AUDIT_COMBINED.md` in this folder, and the playbook content is
   merged into it.
5. No mode declaration, so the planning file assumed a prototype while the
   engineering rules assumed production. Declare the mode in every session.
