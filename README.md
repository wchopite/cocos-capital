# Cocos Capital — Backend Challenge

Brokerage API built with NestJS. Query your portfolio, search instruments, and place/cancel orders against a market of Argentine stocks and CEDEARs, in multiple currencies (ARS/USD).

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

Antes de escribir código me tomé el tiempo de entender el negocio, porque aquí están las reglas que de verdad importan:

- **Las órdenes son el ledger.** No hay una tabla de saldos: las posiciones y el cash **se derivan** de las órdenes `FILLED`. La ventaja es que el saldo nunca se desincroniza de la historia real (cero *drift*), y en un broker "no perder dinero" es la prioridad.
- **El cash es un instrumento `MONEDA`**: ARS (id `66`) y USD (id `67`). Las transferencias entrantes/salientes se modelan como órdenes `CASH_IN`/`CASH_OUT`.
- **`size` depende del `side`**: para `BUY`/`SELL` son títulos; para `CASH_IN`/`CASH_OUT` es el monto en su moneda.
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

El punto: cada contexto define **su propio** tipo (`Quote`, `Holdings`) y el adapter mapea. Si mañana un contexto cambia internamente, el resto no se ve afectado.

### Monolito modular, listo para dividir

Hoy es un **monolito modular**: una sola app, una sola BD. Es mucho más simple de correr, depurar y desplegar para este tamaño. Pero como las dependencias entre contextos pasan por puertos/adapters (y no por imports directos ni tablas compartidas), **dividirlo en microservicios** es cambiar cada adapter por un cliente HTTP/gRPC, sin tocar dominio ni use cases. La hexagonal no es decorativa: es la que habilita esa evolución.

## Decisiones clave

### Money en centavos, magnitudes positivas

Todo el dinero viaja en **centavos (enteros)**, nunca floats. Y con una regla de signo: los valores son **siempre positivos (magnitud)**; el signo lo decide la **operación** (`side` de la orden, o la fórmula de agregación). Nunca se guarda dinero negativo. Vive en `shared/domain/money.ts` y lo usan `orders` y `portfolio`.

### Multi-moneda (ARS / USD)

Cada instrumento cotiza en una moneda (`ARS` o `USD`), y el cash se trackea **por moneda** (`cash: { ARS, USD }`, no un solo número). La orden **toma la moneda del instrumento** (el body no pide moneda): comprar en USD valida contra el cash USD, no contra el ARS. **No hay conversión FX**: las monedas se mantienen y se reportan separadas.

### Cache de cotizaciones (Redis)

`GetLatestQuote` se envuelve en un **cache-aside** (`CachedGetLatestQuote`) respaldado por Redis (puerto `QuoteCache` → `RedisQuoteCache`), con TTL configurable (`QUOTE_CACHE_TTL_SECONDS`, default `30`). En un hit sirve del cache; en un miss va a Postgres y lo guarda. Si Redis está caído, **degrada a pass-through** (la request no se rompe).

### Idempotencia

`POST /orders` acepta el header **`Idempotency-Key`**. Si el server ya vio esa key, devuelve la orden original en vez de duplicarla. En un broker esto es **crítico**: un retry del cliente (timeout, red caída, doble click) no puede terminar en dos órdenes iguales — sería duplicar una operación de dinero. La key la genera el cliente, se persiste junto a la orden (columna `idempotencyKey` con índice único) y un replay devuelve la orden ya guardada. Los retries son *at-least-once* por naturaleza; la idempotencia los vuelve *exactly-once*.

### Concurrencia (no perder dinero)

El saldo se deriva de `orders`, así que para validar "¿le alcanza?" no hay una columna materializada para un `UPDATE ... WHERE`. Uso **pessimistic lock por usuario** (`SELECT ... FOR UPDATE` dentro de una transacción): serializa el ciclo *leer → validar → escribir* de ese usuario, mientras usuarios distintos operan en paralelo. Lo cubre un test e2e que dispara dos órdenes concurrentes del mismo user y verifica una `FILLED` y una `REJECTED`.

### Respuestas y errores consistentes

Toda la API responde con una forma predecible:

- **Éxito**: el DTO de salida, sin wrapper (ej. `OrderDto`, `PortfolioDto`, `InstrumentDto[]`).
- **Error**: un único envelope `{ statusCode, error, message, requestId }`, producido por un filtro global (`DomainExceptionFilter` para errores de dominio, `AllExceptionsFilter` para el resto). El código de negocio va en `error` (ej. `ORDER_NOT_FOUND`), y `requestId` correlaciona la respuesta con su log.
- **Validación de entrada**: `ValidationPipe` global con `whitelist` + `forbidNonWhitelisted` (rechaza campos desconocidos) y `transform`. Un body inválido → `400` con el detalle, en el mismo envelope.

El cliente nunca adivina el shape: cuando algo falla, siempre es `{ statusCode, error, message, requestId }`.

### Seguridad

Sin auth (scope del challenge), pero con las defensas base de una API productiva:

- **helmet** para headers de seguridad (`contentSecurityPolicy` desactivado: es una API, no un sitio).
- **CORS** habilitado.
- **ValidationPipe** con `whitelist` + `forbidNonWhitelisted`: campos inesperados se rechazan, no se ignoran.
- **Redaction** de headers sensibles en los logs (ver observabilidad).

> **Rate limiting** — lo dejé fuera del scope (es un challenge sin auth). En producción lo agregaría con `@nestjs/throttler` por usuario (y Redis como backend si hay varias instancias), más estricto en `POST /orders` que en los `GET`.

El usuario se identifica por el header **`X-User-Id`**; cuando se agregue auth, ese header se reemplaza por el `JWT` y las rutas no cambian.

### Observabilidad: requestId en cada línea

Logs estructurados (JSON) con **pino** + **nestjs-pino**. Cada línea lleva **`reqId`** (eco del header `X-Request-Id`, o UUID si no viene), generado por `pino-http` y propagado a los use cases vía `AsyncLocalStorage`: puedes filtrar todas las líneas de una request. El envelope de error siempre incluye `{ statusCode, error, message, requestId }`, así correlacionas una respuesta con su request en los logs.

- **Niveles**: writes en `info` (ej. `order placed { id, status, userId }`), reads en `debug`, errores de dominio en `warn`, excepciones 5xx en `error`.
- **Seguridad**: redaction de headers sensibles (`authorization`, `cookie`, `x-api-key`, `proxy-authorization`) → `[REDACTED]`. No logueo el body del request ni la valuación total de la cuenta.
- **Config**: `LOG_LEVEL` (default `info`) y `LOG_PRETTY` (pino-pretty, default solo en `development`).

Detalle en [`docs/observability.md`](docs/observability.md).

### Health check

`GET /health` con `@nestjs/terminus` para que un orquestador (o un `docker compose` con healthcheck) sepa si la app está viva.

### Apagado ordenado (graceful shutdown)

Ante `SIGTERM`/`SIGINT` la app hace `enableShutdownHooks()`: deja de aceptar conexiones nuevas, **espera a que terminen las requests en curso** (la transacción de una orden commitea o hace rollback limpio) y solo después cierra. En un broker importa: un deploy/restart no corta una `POST /orders` a la mitad de su transacción (`FOR UPDATE` + `INSERT`). Se combina con la idempotencia: si algo igual muere, el cliente reintenta con la misma `Idempotency-Key` sin duplicar.

### Base de datos: cambios mínimos y justificados

El challenge dice que tengo libertad de modificar tablas "justificando los cambios". Decidí **no cambiar el modelo de datos** (mismas tablas, mismos datos) y solo hacer mejoras **aditivas**. La BD provista (Neon) se **recrea con esas migraciones + seed** (`npm run db:recreate`): queda con los mismos datos que `sql/database.sql`, pero con el esquema endurecido y versionado por migraciones.

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
- **GitHub Actions** como capa extra de validación: en cada push/PR corre el DoD completo (`typecheck + lint + lint:spell + test + test:e2e`), además del hook local de husky/commitlint.
- **Tests en dos niveles:**
  - **unit**: reglas del dominio y use cases con fakes in-memory (rápidos, sin infra).
  - **e2e**: el flujo completo contra un **Postgres real levantado con Testcontainers** (migraciones + seed + requests HTTP). Ahí vive el **test funcional de "enviar orden"** que pide el challenge.
- **La IA como compañera de trabajo.** Dejé configurado el flujo en `.opencode/` (`AGENTS.md`, skills `new-module`/`add-use-case`, el agente `hex-reviewer` y el comando `check`) para que el agente genere scaffolding consistente, revise la hexagonal y no rompa las reglas del repositorio.

## 🛠️ Tech stack

- **NestJS** (TypeScript strict, CommonJS)
- **TypeORM** (PostgreSQL, schema-first migrations)
- **jest** + **eslint** + **prettier** + **husky** + **commitlint**
- **Docker** (local Postgres + Redis + Adminer), **Testcontainers** (e2e)
- **pino** + **Swagger** + **helmet** + **terminus**
- **Redis** (ioredis) — cache de cotizaciones

## 📋 Prerequisites

- Node.js 26
- Docker (only for local development)

## 🚀 Getting started

```bash
npm install
docker compose up -d        # local Postgres + Redis + Adminer
cp .env.example .env        # fill in DB_* if needed
npm run db:setup            # run migrations + seed
npm run start:dev
```

Swagger UI (interactive API docs) is available at `http://localhost:3000/api` in development.

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

### Running against Neon

The app defaults to local Docker (`DB_HOST=localhost`, `DB_SSL=false`). To point it at the
provided Neon database instead:

1. In `.env`, comment out the local `DB_*` values and set the Neon credentials
   (`DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`) with **`DB_SSL=true`**.
2. Rebuild Neon with the migrations + seed (the provided DB has no TypeORM migration
   history, so it needs a full recreate):

   ```bash
   npm run db:recreate
   ```

3. Run the app as usual (`npm run start:dev`).

`db:recreate` drops the tables, applies the migrations and re-seeds the exact sample data,
so Neon ends up with the same data but a hardened, migration-versioned schema.

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
| `npm run db:setup` | `migration:run` + `seed` (fresh database) |
| `npm run db:recreate` | Drop tables + `migration:run` + `seed` (existing database, e.g. Neon) |

## 📚 Documentation

Design documentation lives in [`docs/`](./docs):

- [`architecture.md`](./docs/architecture.md) — modules and hexagonal architecture.
- [`data-model.md`](./docs/data-model.md) — database schema.
- [`order-lifecycle.md`](./docs/order-lifecycle.md) — order state machine.
- [`endpoints.md`](./docs/endpoints.md) — the API endpoints.
- [`sequence-diagrams/`](./docs/sequence-diagrams/README.md) — per-endpoint sequence diagrams through the hexagonal layers.
- [`observability.md`](./docs/observability.md) — logging: requestId propagation, levels, redaction.

The diagrams are written in [Mermaid](https://mermaid.js.org/) and render natively on GitHub (see [Recommended extensions](#-recommended-extensions) to preview them locally).

Ready-to-run request examples (REST Client) live in [`requests/`](./requests). You can also try the
API interactively via **Swagger UI** at `http://localhost:3000/api` (development only).

## 🔌 Recommended extensions

VS Code extensions used in this repo:

- **REST Client** (`humao.rest-client`, by Huachao Mao) — run the request files in [`requests/`](./requests) directly from the editor.
- **Markdown Preview Mermaid Support** (`bierner.markdown-mermaid`) — preview the Mermaid diagrams in `docs/` locally.
