# 03 — CONNECT

> **How to use — one line:**
> `Read AI-Build-Workflow/03-CONNECT.md and apply it to this project.`
> The AI runs the blocks in order and stops at each gate. You only answer
> questions. No file access? Paste this whole file instead. Want manual control?
> Paste one block at a time.

**Run mode:** BUILD · **Input:** a working app from `02-BUILD.md` · **Produces:**
real persistence, safe configuration, one proven external integration · **Gate:**
seed-and-read proof shown, secrets never in the bundle.

This stage is where "it works" becomes "it works with real data". It is also
where most security damage happens: a key in the frontend, a migration with no
rollback, a query that trusts user input.

---

## USE WHEN

- The app needs to store data beyond memory.
- You are adding any third-party service: payments, email, storage, AI, maps.
- You are wiring an MCP server so the agent can read or act on an outside tool.

---

## BLOCK 1 — Database

```
Connect this app to <Postgres | MongoDB | SQLite | MySQL | Supabase | Firebase>.
MODE: <prototype | staging | production>

Do this:
1. Pick the client that fits this stack. Justify in one line. Do not add an ORM
   or query builder the project does not already use without saying why.
2. Environment variables: name them, add them to .env.example with safe
   placeholders, confirm .env is ignored by git. Never print a real value.
3. Schema for these entities: <list>. For each: fields with types, nullability,
   defaults, relationships, and the indexes needed for these queries: <list your
   hot queries>.
4. Write the migration. Then write the rollback. Show both before running
   anything.
5. Run the migration against the local or development database only.
6. Create one typed data-access helper per table or collection. Components and
   route handlers call the helper. No raw queries scattered through UI code.
7. Permissions: if this is multi-user or multi-tenant, enforce ownership on the
   server on every read and write. For Postgres, use row-level security where
   available. For document databases, use strict schemas and reject
   user-supplied query operators.
8. If serverless: configure connection pooling and say which `MODE` this is for.

Then prove it:
- Insert one row through the helper.
- Read it back through the helper.
- Show the actual output.
- Show the rollback command, and confirm it exists and is valid (do not run it
  on data you need).

Stop before touching any non-development database.
```

**What "proven" means.** A connection that opens is not a working data layer.
The seeded row and the read-back are the evidence. If the agent cannot show the
output, the stage is `BLOCKED`, not done.

**Prototype shortcut.** You may skip RLS and pooling under `MODE: prototype` if
the app has no real users. Write that decision in the PRD's "Not in v1" list so it
surfaces at audit time.

## BLOCK 2 — Secrets and configuration

```
Audit configuration for this project and fix what is wrong.

Check and report each with PASS / FAIL / N/A:
1. No secret appears in source, tests, fixtures, logs, or client bundles.
   Search the repo and the git history for key-like strings. Mask any hit as
   sk_l**** when reporting.
2. .env is ignored. .env.example contains names and placeholders only.
3. No secret is imported into client-side code. Anything that reaches the
   browser is public, including framework "public" prefixes.
4. Development and production values are separate. No production credential is
   in a local file.
5. Debug mode, verbose errors, and dev-only endpoints are off in the production
   config.
6. Missing variables fail loudly at startup instead of silently becoming
   undefined.

Report a table: variable | used where | scope (server/client) | safe?

Do not rotate or delete any credential. List what a human must rotate.
```

## BLOCK 3 — External service

Use for payments, email, storage, AI, maps, analytics.

```
Integrate <service> for <purpose>. MODE: <prototype | staging | production>

1. Confirm the official SDK or API and its current version. State the source.
2. Keep the credential server-side. The browser must never see it. If the
   service requires a client-side key, confirm it is a publishable key with the
   minimum scope, and say so explicitly.
3. Implement the happy path and these failure paths: timeout, rate limit,
   invalid response, provider outage, duplicate submission.
4. Make repeated submissions safe. For payments and orders, use idempotency
   keys. Never double-charge on a retry.
5. Cost controls: a per-user cap, a global cap, bounded retries with backoff, a
   timeout on every call, and a kill switch (a config flag that disables the
   integration without a deploy). If it is a paid API, estimate the worst-case
   monthly cost with the caps in place and show the arithmetic.
6. Log every call with: route, user, units consumed, cost estimate. Never log
   the request body if it can contain personal data.
7. Wrap it behind one server-side module. No direct calls from components.

Then prove it: make one real call end to end with the sandbox or test key, show
the request, the response, and the cost estimate. Then trigger the kill switch
and show that no call goes out.
```

`MODE: prototype` may reduce item 5 to "a timeout and a cap".
`MODE: production` may not skip it.

## BLOCK 4 — MCP server (optional)

Use when the agent needs to read or act on an outside system: issue tracker,
database, docs, design tool, browser.

```
Wire up an MCP server for <service>. MODE: <prototype | staging | production>

1. Check for an official or well-maintained existing server first. Name your
   source and last release date.
2. If one exists: give me the exact install command and the project-scoped
   config file. Explain what each field does.
3. If not: scaffold one. Tools, typed inputs and outputs, auth, error handling,
   and a clear failure message.
4. Add only the tools I will actually use: <list>. Extra tools are extra attack
   surface and extra tokens.
5. Secrets come from environment variables. Never hardcode a key in the config
   file, and never commit the config if it contains a token.
6. Scope permissions to the minimum that makes the tools work. Read-only where
   possible.
7. Verify by calling one tool end to end and showing the output.
8. Document each tool in one line: what it does and when to reach for it.

Report which tools are read-only and which can change state.
```

Write-changing tools deserve a confirmation step. If a tool can delete or
publish, say so and require explicit confirmation before it runs.

---

## IT'S DONE WHEN

- Migrations exist with a matching, valid rollback.
- A row can be written and read through the typed helper, with output shown.
- `.env.example` is committed, `.env` is not.
- A search for secrets in the repo returns nothing unmanaged.
- No credential is reachable from the browser.
- External calls have a timeout, a cap, and a kill switch (or the deviation is
  written down).
- Any MCP tool has been called successfully once, and its permission level is
  documented.

## GATE

```
GATE — CONNECT
Done:      data path proven, secrets clean, caps set
Evidence:  wrote one row and read it back; rollback `<command>`; caps `<values>`
I need:    approval to start stage 5
Reply:     go   |   fix first   |   stop
```

If you cannot show the read-back output, you are not done. A data layer that has
never round-tripped is a guess.

## COMMON FAILURES

- **Service key in the frontend.** The classic. Any key in a client bundle is
  public, even if it is in an environment variable.
- **`.env` committed once.** It lives in git history forever. Rotating the key is
  the only real fix, and a human must do it.
- **Migration with no down path.** You will not need it until the moment you
  desperately need it.
- **Trusting an ORM to validate.** An ORM prevents some injection. It does not
  validate ranges, ownership, or business rules.
- **No timeout on an external call.** One slow provider becomes one hung request
  becomes one hung server.
- **Unbounded paid calls.** A retry loop against a paid API is a billing incident
  with a delay.
- **Installing every MCP tool available.** Each one is permission you granted
  something you did not read.
