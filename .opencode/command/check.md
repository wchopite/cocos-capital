---
description: Run the project Definition of Done (typecheck, lint, unit + e2e tests).
---

Run the Definition of Done and report a concise summary (pass/fail per step). If a step fails, show the failing output and stop.

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run test:e2e` — uses Testcontainers (Postgres); requires Docker running.
