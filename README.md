# Cocos Capital — Backend Challenge

Brokerage API built with NestJS. Query your portfolio, search instruments, and place/cancel orders against a market of Argentine stocks and ARS cash.

![CI](https://github.com/wchopite/cocos-capital/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Node: 26](https://img.shields.io/badge/node-26-green)
![TypeScript: strict](https://img.shields.io/badge/TypeScript-strict-blue)

## 🛠️ Tech stack

- **NestJS** (TypeScript strict, CommonJS)
- **TypeORM** (PostgreSQL, schema-first migrations)
- **jest** + **eslint** + **prettier** + **husky** + **commitlint**
- **Docker** (local Postgres + Adminer), **Testcontainers** (e2e)

## 📋 Prerequisites

- Node.js 26
- Docker (only for local development)

## 🚀 Getting started

```bash
npm install
docker compose up -d        # local Postgres + Adminer
cp .env.example .env        # fill in DB_* if needed
npm run start:dev
```

## 🗄️ Database

The challenge provides a **PostgreSQL** database (Neon, in the cloud) with sample data.

- **Host**: provided by email
- **Port**: provided by email
- **Database**: provided by email
- **User / password**: provided by email

Quick check:

```bash
docker run --rm -it postgres:17-alpine psql \
  "postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
```

The schema and sample data are documented in `sql/database.sql`.

## ⚙️ Scripts

| Script | Description |
| --- | --- |
| `npm run start:dev` | Run in development (watch mode) |
| `npm run build` | Compile |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm run lint:spell` | Spell check (cspell) |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests (Testcontainers) |

## 📚 Documentation

Design documentation lives in [`docs/`](./docs):

- [`architecture.md`](./docs/architecture.md) — modules and hexagonal architecture.
- [`data-model.md`](./docs/data-model.md) — database schema.
- [`order-lifecycle.md`](./docs/order-lifecycle.md) — order state machine.
- [`endpoints.md`](./docs/endpoints.md) — the API endpoints.

The diagrams are written in [Mermaid](https://mermaid.js.org/) and render natively on GitHub (see [Recommended extensions](#-recommended-extensions) to preview them locally).

## 🔌 Recommended extensions

VS Code extensions used in this repo:

- **REST Client** (`humao.rest-client`, by Huachao Mao) — run the request files in [`requests/`](./requests) directly from the editor.
- **Markdown Preview Mermaid Support** (`bierner.markdown-mermaid`) — preview the Mermaid diagrams in `docs/` locally.
