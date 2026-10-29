# 06 — SHIP

> **How to use — one line:**
> `Read AI-Build-Workflow/06-SHIP.md and apply it to this project.`
> The AI runs the blocks in order and stops at each gate. You only answer
> questions. No file access? Paste this whole file instead. Want manual control?
> Paste one block at a time.

**Run mode:** LAUNCH · **Input:** the audit report from `05-AUDIT.md` · **Produces:**
verified fixes, a release gate checklist with evidence, a signed sign-off ·
**Gate:** a named human signs. Not the agent.

The audit finds. This stage fixes, proves, and decides. The decision belongs to
a person, because the agent cannot accept risk on your behalf.

---

## USE WHEN

- The audit report exists and you have read it.
- You are about to point a domain at the app.
- You are about to give real users real credentials.

---

## BLOCK 1 — Fix approved items only

```
Implement only the approved findings: <list IDs>.

For each:
1. Re-open the location and confirm the finding still exists. If it does not,
   say so and close it as stale with the evidence.
2. Make the smallest change that removes the risk. Do not refactor around it.
3. Add or update a test that would fail if the risk returned.
4. Map every changed line to a finding ID. No unrelated edits.
5. If a fix requires a production change, a destructive migration, secret
   rotation, a new paid service, or a new third party: stop and ask. Do not
   proceed on your own judgment.

Report per finding:
ID | what changed | files | verification | status (open / fixed / stale / accepted risk)

Never mark an item fixed if the verification did not run. Keep it `open` and mark
that check `BLOCKED` with what is missing.
```

**Do not let it fix anything unapproved.** "While I was in there" is how a
reviewable change becomes an unreviewable one.

## BLOCK 2 — Verify

```
Run the verification that matches each fixed finding. MODE: production.

Required where applicable:
1. Reproduce the original problem. Show that it no longer occurs.
2. Run the regression test. Show it passes, and confirm it fails on the previous
   commit.
3. Typecheck, lint, unit, integration, production build, app startup.
4. Exercise the affected flows manually, including the failure path.
5. Check the logs for new errors.
6. Check the neighbouring features for regressions.
7. Review the full diff against the base branch.

Report a table: check | command | PASS/FAIL/BLOCKED/NOT RUN/N/A | evidence.
Then list: checks not run, and why.
```

A check you cannot run is `BLOCKED` with a named reason, not a silent omission.

## BLOCK 3 — Release gate

```
Produce the release gate checklist for this project. Fill what can be verified
from the repo and the evidence we already have. Mark everything else
NOT VERIFIED with the exact action needed.

Group: BEFORE LAUNCH / LAUNCH DAY / FIRST 30 DAYS.

BEFORE LAUNCH
- Core flows work end to end, with runtime evidence (not code-tracing).
- All CRITICAL and HIGH findings are fixed, or explicitly accepted in writing by
  a named person.
- Production environment variables are set, and no production secret exists in
  the repo or the client bundle.
- HTTPS enforced; security headers and CSP tested on the deployed domain.
- Cookies: Secure, HttpOnly, SameSite, correct scope.
- CORS restricted to known origins.
- Auth: rate limits live, sessions expire, password reset works, admin routes
  protected server-side.
- Database: least-privilege user, migrations applied, rollback rehearsed.
- Backups: scheduled, and one restore actually tested. State the date.
- Paid APIs: spend caps and alerts set in the provider dashboard, kill switch
  tested.
- Monitoring: error tracking, uptime check, and an alert that reaches a human.
- Logs contain no passwords, tokens, or unnecessary personal data.
- Legal: privacy notice, terms, cookie consent, refund policy as applicable,
  every claim reviewed by a human ([VERIFY] closed or accepted).
- Accessibility: keyboard pass, focus visible, labels present, contrast checked.
- Domain, DNS, certificates, and deployment identity confirmed.
- Rollback path documented, with the exact command and who runs it.

LAUNCH DAY
- Deploy to production using the documented steps.
- Smoke test the five most important actions as a real user.
- Confirm error tracking is receiving events.
- Confirm the database is reachable from the deployed environment.
- Confirm the spend dashboard shows the expected baseline.
- Keep the previous known-good build available.

FIRST 30 DAYS
- Watch error rate, auth failures, and cost daily for week one.
- Confirm backups run and are restorable.
- Re-run the audit (`05-AUDIT.md`, shortcut `re-audit`) after any large change.
- Track accepted risks and review them at day 30.
```

## BLOCK 4 — Handoff report

Do not skip this because you are the only developer. You in three months is a
different person.

```
Write the implementation handoff for this release.

1. What was built and where. One paragraph, then the file map.
2. Security and privacy controls added or changed.
3. Tests actually run, with results.
4. Tests not run, and why.
5. Required environment variables, and any dashboard action a human must take.
6. Deployment, rollback, and backup instructions, including how to restore.
7. Known limitations, TODOs, and unverified assumptions.
8. Status: prototype / staging candidate / passed the human release gate.

Save it as docs/handoff-<date>.md. Do not describe planned work as done.
```

## BLOCK 5 — Sign-off

The agent fills the evidence fields. A human fills the name, the date, the
accepted-risk decision and owner, and the release status.

```
| Field | Value |
|---|---|
| Project |  |
| Production domain |  |
| Version or commit |  |
| Audit report date |  |
| Critical open |  |
| High open |  |
| Accepted risks (with owner) |  |
| Backup restore tested on |  |
| Rollback tested on |  |
| Reviewed by (human name) |  |
| Date |  |
| Release status | SHIPPED / HOLD |
```

**The agent never fills:** `Reviewed by`, `Date`, the accepted-risk decision or
owner, or `Release status`. A human writes those or they stay blank.

---

## THE SHIP LOOP

```
audit report (05)
      |
      v
approve IDs  ---> fix (block 1) ---> verify (block 2)
                                          |
                                     FAIL | PASS
                                          |      \
                                    fix again     gate checklist (block 3)
                                                       |
                                                  handoff + sign-off (4, 5)
                                                       |
                                                  deploy -> smoke -> watch
```

---

## IT'S DONE WHEN

- Every approved ID is fixed, blocked with a reason, or accepted in writing.
- Every REGRESSION test is shown failing on the old code and passing on the new.
- The gate checklist has a status and an evidence line for every item.
- A restore has actually been performed, with a date.
- The rollback command has been run or walked through, with a name attached.
- The handoff document exists.
- A human filled the release status.

## GATE

Use this shape exactly, then stop:

```
GATE — SHIP
Done:      <n> items verified, <n> unverified, <n> accepted risks
Evidence:  handoff docs/handoff-<date>.md; restore date <date>; rollback <command>
I need:    your signature, or a decision to hold
Reply:     sign   |   hold   |   fix <IDs>
```

I will not deploy until you say so explicitly.

## COMMON FAILURES

- **Fixing unapproved items.** Review scope disappears.
- **"Backups are on" as backup evidence.** A backup that has never been restored
  is a hope.
- **Deploying on a green build.** The build proves the bundle compiles, nothing
  about the deployed environment, DNS, certificates, or env vars.
- **The agent declaring readiness.** It can report evidence. It cannot accept
  risk. Keep the signature human.
- **Skipping the smoke test because the deploy was clean.** Clean deploys break
  more quietly than dirty ones.
- **No rollback rehearsal.** The first time you run a rollback should not be the
  incident.
- **Watching nothing after launch.** The most expensive bugs are the ones nobody
  sees for a week.
