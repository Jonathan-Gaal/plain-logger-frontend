# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

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

This is the UI for **Plain Logger** and talks to the separate
`plain-logger-backend` API (expected at `../plain-logger-backend`).

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
