# Contributing

## Setup

See the [README](./README.md) for prerequisites and getting started.

## Conventions

- Conventional Commits, single-line subjects. Scopes: `instruments`, `orders`, `portfolio`, `shared`, `api`, `db`, `observability`, `security`, `deps`, `tooling`, `docs`, `http`.
- Hexagonal architecture: `domain` / `application` / `infrastructure`. See `AGENTS.md`.

## Definition of Done

```bash
npm run typecheck && npm run lint && npm test && npm run test:e2e
```
