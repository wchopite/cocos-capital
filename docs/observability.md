# Observability

Structured JSON logging with **pino** + **nestjs-pino**. Every line carries the request
correlation id (`reqId`) so all lines of one request can be filtered together.

## requestId propagation

`pino-http` generates `reqId` from the `X-Request-Id` header (echoed) or a UUID, and binds
it to a per-request child logger. `nestjs-pino` stores that logger in an `AsyncLocalStorage`
(`storage`) during the request, so any `PinoLogger` injected anywhere — use case, filter,
controller — resolves to the **request-scoped** logger and emits the same `reqId`:

```
GET /portfolio        reqId: abc…  ->  "portfolio computed"   reqId: abc…
                                     ->  "request completed"    reqId: abc…
```

No external tracing system is needed; the id just flows through the async context.

## Levels

| Level | What logs there |
| --- | --- |
| `info` | writes: `order placed` (with `id`/`status`/`userId`), `order cancelled` |
| `debug` | reads: search, quote, holdings, portfolio; idempotent replay |
| `warn` | expected domain errors (4xx) in `DomainExceptionFilter` |
| `error` | unexpected errors / 5xx in `AllExceptionsFilter` |

Default level is `info` (`LOG_LEVEL`), so the high-frequency read path stays quiet in
production while every write and every error is visible.

## What each module logs

- **orders** — `PlaceOrderUseCase` logs the outcome of every order (`order placed` with
  `orderId`, `userId`, `instrumentId`, `side`, `type`, `status`, `size`, `price`); `CancelOrderUseCase`
  logs `order cancelled`. `GetHoldingsUseCase` logs a `debug` line with the position count.
- **portfolio** — `GetPortfolioUseCase` logs a `debug` line with the position count
  (never the account value).
- **instruments** — `SearchInstrumentsUseCase` and `GetLatestQuoteUseCase` log `debug` lines.

Writes at `info`, reads at `debug`: the money path is always visible, the read path is on demand.

## Redaction (safe logs)

Sensitive headers are redacted before they hit the sink:

- `authorization`, `cookie`, `x-api-key`, `proxy-authorization` → `[REDACTED]`

Visible and non-secret: `x-user-id`, `idempotency-key`, `x-request-id`.

Request **bodies** are not logged (pino-http does not serialize them), and use cases do not
log account totals (net worth) — only the order values needed to reconcile a trade.

## Configuration

| Env | Default | Meaning |
| --- | --- | --- |
| `LOG_LEVEL` | `info` | pino level (`trace` … `fatal`) |
| `LOG_PRETTY` | `true` only in `development` | pretty-print via `pino-pretty` (dev only; JSON in prod/test) |

Set in `.env`; validated by `env.validation.ts`. `pino-pretty` is a devDependency, so
production never loads it.
