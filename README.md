# Cocos Capital — Backend Challenge

Brokerage API built with NestJS. Query your portfolio, search instruments, and place/cancel orders against a market of Argentine stocks and ARS cash.

## Tech stack

- **NestJS** (TypeScript strict, CommonJS)
- **TypeORM** (PostgreSQL, schema-first migrations)
- **jest** + **eslint** + **prettier** + **husky** + **commitlint**
- **Docker** (local Postgres + Adminer), **Testcontainers** (e2e)

## Prerequisites

- Node.js 26
- Docker (only for local development)

## Getting started

```bash
npm install
docker compose up -d        # local Postgres + Adminer
cp .env.example .env        # fill in DB_* if needed
npm run start:dev
```

## Database

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

The schema and sample data are documented in `db/database.sql`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run start:dev` | Run in development (watch mode) |
| `npm run build` | Compile |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm run lint:spell` | Spell check (cspell) |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests (Testcontainers) |
