# Plain Logger — frontend

The UI for **Plain Logger**, an internal diagnostic tool for Tier-2 support
specialists. Paste a raw JSON error log and it returns two things: a
technical **specialist diagnostic**, and a plain-language **employee-facing
message** to send to whoever filed the ticket. The lookup is a deterministic
match against a known-errors table — no LLM anywhere in the path.

React + TypeScript + Vite. Talks to the separate `plain-logger-backend` API
via `VITE_API_BASE_URL`.

## What the UI does

**Parse Log tab** — paste a payload, get the two messages side by side, each
with a copy button, plus a running history of recent parses.

- *Wrapped payloads work.* Real logs arrive inside a logging-library
  envelope (Sentry's `extra`, axios's `response.data`, Winston's `meta`).
  The backend searches nested objects and arrays, so a code two levels down
  still matches.
- *Every result names where the code came from.* A short line above the
  result cards reports the exact path — `error_code` for a top-level hit,
  `meta.error.error_code` for a wrapped one — and flags nested paths
  explicitly, so a surprising match is traceable rather than taken on faith.
- *An unrecognized code isn't a dead end.* Paste `node.temperatur` and the
  card offers `node.temperature` as a near-miss, with its system, severity,
  and a match percentage. Ranking is string distance over the same
  known-errors table — no LLM, and the result stays *unmapped*, so a lead is
  never presented as a match. A genuinely novel code shows no suggestions at
  all rather than three bad guesses.

**Tickets tab** — the active work queue. Filter by status, sort by severity,
open a ticket to re-parse its payload, edit the stored messages, or create a
template for a code that isn't mapped yet.

**Unmapped Codes tab** — the gap queue. Every code that's been parsed but has
no template, grouped with a hit count and a first/last-seen window, worst gap
first, each with its closest known code as a lead. Parse history already
recorded all of this; grouping it answers the question a Tier-2 lead actually
has — *which missing template is costing us the most?* — instead of leaving
it buried in a list nobody scrolls back through.

## Vite template notes

Two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Testing

The backend is expected at `../plain-logger-backend`.

- **Unit / component tests** (Vitest + Testing Library, mocked API — no
  servers needed):

  ```bash
  npm run test:unit
  ```

- **End-to-end tests** (Playwright) drive the real UI against a **real,
  seeded backend** — not mocks — so they exercise actual ticket data and the
  parse-log flow.

- **One command, zero setup** — seeds a throwaway backend DB, boots both the
  backend and frontend, runs unit + e2e, and tears everything down:

  ```bash
  npm run test:all
  ```

### Git hooks (tests must pass before commit/push)

[Husky](https://typicode.github.io/husky) hooks gate commits and pushes:

- **pre-commit** → `npm run typecheck && npm run test:unit` (fast).
- **pre-push** → `npm run test:all` (unit + full Playwright e2e against a live
  backend; blocks the push on any failure).

Hooks install automatically via the `prepare` script on `npm install`. If you
cloned before they existed, run `npm install` once. Emergency bypass (not
recommended): `git push --no-verify`.
