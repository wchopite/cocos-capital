# Cocos Capital — Backend Challenge

Brokerage API built with NestJS. Query your portfolio, search instruments, and place/cancel orders against a market of Argentine stocks and ARS cash.

![CI](https://github.com/wchopite/cocos-capital/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Node: 26](https://img.shields.io/badge/node-26-green)
![TypeScript: strict](https://img.shields.io/badge/TypeScript-strict-blue)

## El problema

El challenge pide una API REST con cuatro capacidades:

| # | Método | Endpoint | Qué hace |
|---|---|---|---|
| 1 | `GET` | `/portfolio` | valor total de la cuenta, pesos disponibles y posiciones (cantidad, valor `$` y rendimiento `%`) |
| 2 | `GET` | `/instruments?q=` | buscar activos por ticker o por nombre |
| 3 | `POST` | `/orders` | enviar una orden (`BUY`/`SELL`, `MARKET`/`LIMIT`) |
| 4 | `DELETE` | `/orders/:orderId` | cancelar una orden `NEW` |

Sin autenticación (scope del challenge): el usuario se identifica con el header **`X-User-Id`**. Lo dejé fuera del path a propósito, así mañana se reemplaza por el `JWT` sin tocar las rutas.

## Entender el dominio

Antes de escribir código me tomé el tiempo de entender el negocio, porque acá están las reglas que de verdad importan:

- **Las órdenes son el ledger.** No hay una tabla de saldos: las posiciones y el cash **se derivan** de las órdenes `FILLED`. La ventaja es que el saldo nunca se desincroniza de la historia real (cero *drift*), y en un broker "no perder plata" manda.
- **El cash (ARS) es un instrumento `MONEDA`** (id `66`). Las transferencias entrantes/salientes se modelan como órdenes `CASH_IN`/`CASH_OUT`.
- **`size` depende del `side`**: para `BUY`/`SELL` son títulos; para `CASH_IN`/`CASH_OUT` son pesos.
- **El ciclo de vida de la orden** (detalle en [`order-lifecycle.md`](docs/order-lifecycle.md)):
  - `MARKET` → se ejecuta al último `close` y queda `FILLED`.
  - `LIMIT` → requiere precio y queda `NEW` (no se ejecuta solo; no simulo mercado).
  - Insuficiente (sin cash para comprar / sin títulos para vender) → `REJECTED` **y se guarda**.
  - Solo se cancela lo que está `NEW` → `CANCELLED`.

## Arquitectura

### Hexagonal (puertos y adapters)

Elegí **arquitectura hexagonal**. Tres capas por contexto con una regla de dependencia estricta:

```
infrastructure → application → domain
```

- **domain**: tipos puros + reglas de negocio. Sin Nest, sin TypeORM, sin HTTP. Testeable con funciones puras.
- **application**: use cases que orquestan el dominio y los puertos. Solo usan Nest para inyección de dependencias.
- **infrastructure**: persistencia (TypeORM), controllers HTTP y adapters a otros contextos.

La regla es innegociable: el dominio **no** importa Nest/TypeORM/HTTP. Y para que no se rompa nunca, lo verifico con un **test de arquitectura** (`test/architecture.spec.ts`) que escanea los imports de `domain/` en cada `npm test`.

### Los tres contextos

El negocio lo dividí en tres contextos (`instruments`, `orders`, `portfolio`). Cada uno expone sus **puertos `in`** (lo que ofrece) y declara sus **puertos `out`** (lo que necesita):

```mermaid
graph LR
  subgraph instruments["instruments"]
    SearchInstruments
    GetLatestQuote
  end
  subgraph orders["orders"]
    PlaceOrder
    CancelOrder
    GetHoldings
  end
  subgraph portfolio["portfolio"]
    GetPortfolio
  end
  PlaceOrder -->|"cotización"| GetLatestQuote
  GetPortfolio -->|"posiciones + cash"| GetHoldings
  GetPortfolio -->|"cotización"| GetLatestQuote
```

### Capa anti-corrupción

Ningún contexto importa el interior de otro. Se comunican por un **contrato publicado** (un puerto `in` con su token `Symbol`) y un **adapter** que traduce:

- `orders` necesita el precio → `InstrumentsQuoteAdapter` consume `GetLatestQuote` de `instruments`.
- `portfolio` necesita posiciones/cash y precios → `OrdersHoldingsAdapter` + `InstrumentsQuoteAdapter`.

La gracia: cada contexto define **su propio** tipo (`Quote`, `Holdings`) y el adapter mapea. Si mañana un contexto cambia internamente, el resto no se entera.

### Monolito modular, listo para dividir

Hoy es un **monolito modular**: una sola app, una sola BD. Es mucho más simple de correr, depurar y desplegar para este tamaño. Pero como las dependencias entre contextos pasan por puertos/adapters (y no por imports directos ni tablas compartidas), **dividirlo en microservicios** es cambiar cada adapter por un cliente HTTP/gRPC, sin tocar dominio ni use cases. La hexagonal no es decorativa: es la que habilita esa evolución.

## Decisiones clave

### Money en centavos, magnitudes positivas

Toda la plata viaja en **centavos (enteros)**, nunca floats. Y con una regla de signo: los valores son **siempre positivos (magnitud)**; el signo lo decide la **operación** (`side` de la orden, o la fórmula de agregación). Nunca se guarda dinero negativo. Vive en `shared/domain/money.ts` y lo usan `orders` y `portfolio`.

### Idempotencia

`POST /orders` acepta el header **`Idempotency-Key`**: si el server ya vio esa key, devuelve la orden original en vez de duplicarla. Evita el clásico "retry del cliente" que mete dos órdenes iguales.

### Concurrencia (no perder plata)

El saldo se deriva de `orders`, así que para validar "¿le alcanza?" no hay una columna materializada para un `UPDATE ... WHERE`. Uso **pessimistic lock por usuario** (`SELECT ... FOR UPDATE` dentro de una transacción): serializa el ciclo *leer → validar → escribir* de ese usuario, mientras usuarios distintos operan en paralelo. Lo cubre un test e2e que dispara dos órdenes concurrentes del mismo user y verifica una `FILLED` y una `REJECTED`.

### Observabilidad: requestId en cada línea

Logs estructurados (JSON) con **pino** + **nestjs-pino**. Cada línea lleva **`reqId`** (eco del header `X-Request-Id`, o UUID si no viene), generado por `pino-http` y propagado a los use cases vía `AsyncLocalStorage`: podés filtrar todas las líneas de una request. El envelope de error siempre incluye `{ statusCode, error, message, requestId }`, así correlacionas una respuesta con su request en los logs.

- **Niveles**: writes en `info` (ej. `order placed { id, status, userId }`), reads en `debug`, errores de dominio en `warn`, excepciones 5xx en `error`.
- **Seguridad**: redaction de headers sensibles (`authorization`, `cookie`, `x-api-key`, `proxy-authorization`) → `[REDACTED]`. No logueo el body del request ni la valuación total de la cuenta.
- **Config**: `LOG_LEVEL` (default `info`) y `LOG_PRETTY` (pino-pretty, default solo en `development`).

Detalle en [`docs/observability.md`](docs/observability.md).

### Health check

`GET /health` con `@nestjs/terminus` para que un orquestador (o un `docker compose` con healthcheck) sepa si la app está viva.

### Base de datos: cambios mínimos y justificados

El challenge dice que tengo libertad de modificar tablas "justificando los cambios". Decidí **no tocar el esquema provisto** y solo hacer mejoras **aditivas**, por una razón simple: la BD provista (Neon) es la **referencia** que da el challenge (no la modifiqué); mis mejoras viven en las migraciones (BD local/test) y tienen que seguir siendo compatibles con ella.

- **Lo que SÍ agregué (aditivo, justificado):**
  - Constraints CHECK en `side`/`type`/`status` — validar en código **y** en BD.
  - Índices en `orders.userId`, `orders.status`, `marketdata.instrumentId` (Postgres no indexa FKs).
  - `NOT NULL` donde corresponde.
  - La columna `idempotencyKey` (para la idempotencia de `POST /orders`).
- **Lo que NO cambié (y por qué):**
  - **`SERIAL` → `UUID`**: la BD usa enteros y las FKs apuntan a IDs concretos (ej. `66 = ARS`). `UUID` queda para un branch futuro (multi-servicio, IDs no adivinables).
  - **Dividir `size`**: el challenge manda "usar la columna `size`"; dividirla contradice lo que pide demostrar.
  - **Materializar saldos**: el saldo derivado es siempre correcto (cero drift); materializarlo reintroduce el riesgo de drift.

## Cómo lo desarrollé

- **Conventional Commits, commits atómicos.** Un cambio lógico por commit, con scope (`instruments`, `orders`, `portfolio`, `shared`, `db`, `docs`, …). La historia de `git log` cuenta el desarrollo por sí sola.
- **Todo en `main`.** Decidí no simular git-flow: un único `main` con commits atómicos es más fácil de leer para un challenge. (En equipo iría trunk-based con branches cortos y PRs.)
- **GitHub Actions** como capa extra de validación: en cada push corre `typecheck + lint + test`, además del hook local de husky/commitlint.
- **Tests en dos niveles:**
  - **unit**: reglas del dominio y use cases con fakes in-memory (rápidos, sin infra).
  - **e2e**: el flujo completo contra un **Postgres real levantado con Testcontainers** (migraciones + seed + requests HTTP). Ahí vive el **test funcional de "enviar orden"** que pide el challenge.
- **La IA como compañera de trabajo.** Dejé configurado el flujo en `.opencode/` (`AGENTS.md`, skills `new-module`/`add-use-case`, el agente `hex-reviewer` y el comando `check`) para que el agente genere scaffolding consistente, revise la hexagonal y no rompa las reglas de la casa.

## 🛠️ Tech stack

- **NestJS** (TypeScript strict, CommonJS)
- **TypeORM** (PostgreSQL, schema-first migrations)
- **jest** + **eslint** + **prettier** + **husky** + **commitlint**
- **Docker** (local Postgres + Adminer), **Testcontainers** (e2e)
- **pino** + **Swagger** + **helmet** + **terminus**

## 📋 Prerequisites

- Node.js 26
- Docker (only for local development)

## 🚀 Getting started

```bash
npm install
docker compose up -d        # local Postgres + Adminer
cp .env.example .env        # fill in DB_* if needed
npm run db:setup            # run migrations + seed
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
| `npm test` | Unit tests (incl. architecture test) |
| `npm run test:e2e` | End-to-end tests (Testcontainers) |
| `npm run migration:run` / `migration:revert` | Apply / revert migrations |
| `npm run seed` | Load sample data |
| `npm run db:setup` | `migration:run` + `seed` |

## 📚 Documentation

Design documentation lives in [`docs/`](./docs):

- [`architecture.md`](./docs/architecture.md) — modules and hexagonal architecture.
- [`data-model.md`](./docs/data-model.md) — database schema.
- [`order-lifecycle.md`](./docs/order-lifecycle.md) — order state machine.
- [`endpoints.md`](./docs/endpoints.md) — the API endpoints.
- [`sequence-diagrams/`](./docs/sequence-diagrams/README.md) — per-endpoint sequence diagrams through the hexagonal layers.
- [`observability.md`](./docs/observability.md) — logging: requestId propagation, levels, redaction.

The diagrams are written in [Mermaid](https://mermaid.js.org/) and render natively on GitHub (see [Recommended extensions](#-recommended-extensions) to preview them locally).

Ready-to-run request examples (REST Client) live in [`requests/`](./requests).

## 🔌 Recommended extensions

VS Code extensions used in this repo:

- **REST Client** (`humao.rest-client`, by Huachao Mao) — run the request files in [`requests/`](./requests) directly from the editor.
- **Markdown Preview Mermaid Support** (`bierner.markdown-mermaid`) — preview the Mermaid diagrams in `docs/` locally.
