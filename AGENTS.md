# AGENTS.md

Project guide for AI agents. The code is the source of truth.

## What this is

NestJS backend: a brokerage API with three modules — **instruments** (catalog + market data), **orders** (place/cancel orders + ledger), **portfolio** (account valuation). TypeScript strict, CommonJS, jest + eslint.

## Commands

- Infra: `docker compose up -d` (local Postgres + Adminer) · local DB: `npm run db:setup`
- Dev: `npm run start:dev`
- Definition of Done: `npm run typecheck && npm run lint && npm test && npm run test:e2e`
- e2e uses Testcontainers (Postgres); requires Docker running.

## Architecture (do not break)

- Three modules: `instruments`, `orders`, `portfolio`. Each is hexagonal: `domain` / `application` / `infrastructure`.
- Dependency rule: `infrastructure -> application -> domain`. **`domain` must not import Nest, TypeORM, HTTP, or `infrastructure`.** `application` uses Nest only for DI/logging.
- Ports: `<module>/domain/ports/in/*` (offers) and `.../out/*` (needs). Export a `Symbol` token named after the type (e.g. `ORDER_REPOSITORY` / `OrderRepository`).
- Persistence: TypeORM entities (`*.orm-entity.ts`) are **not** domain models; map them in `infrastructure/persistence/mappers`. Migrations are schema-first (`DB_SYNCHRONIZE=false`).
- Cross-module: talk through a published contract via an **adapter** (e.g. `InstrumentsQuoteAdapter`). No cross-module FKs or direct imports of another module's internals.

## Conventions

- Identifiers in English; code comments in English.
- **No comments** unless explicitly requested.
- Conventional Commits, single-line subjects. Scopes: `instruments`, `orders`, `portfolio`, `shared`, `api`, `db`, `observability`, `security`, `deps`, `tooling`, `docs`, `http`.
- Committed docs: `README.md` and `docs/`. Working notes live in `notes/` (untracked).
- User identification: via the `X-User-Id` header (no auth). Replaced by the JWT-derived user when auth is added — keep it out of the URL path.

## Documentation

- Committed documentation: `README.md` and `docs/` (architecture, data model, order lifecycle, endpoints).
- Keep them in sync: whenever you change code, domain rules, endpoints, or scripts, verify and update `README.md` and `docs/` accordingly.
- Also update `.env.example` when you add an env var, and `CONTRIBUTING.md` when the DoD or conventions change.

## Do not break

- Logs: pino request binding / `requestId` on every line.
- Global exception filter order in `app.module.ts` (Nest reverses it).
- `ValidationPipe` (whitelist) and the error envelope `{ statusCode, error, message, requestId }`.

## How to add

- New module: `.opencode/skill/new-module`.
- New use case / endpoint: `.opencode/skill/add-use-case`.
