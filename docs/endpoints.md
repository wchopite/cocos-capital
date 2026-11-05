# Endpoints

The API has four endpoints: the three listed in the challenge, plus **cancel** (implied by the order lifecycle rule "only `NEW` orders can be cancelled").

There is **no authentication** (challenge scope): the user is identified by the **`X-User-Id`** header. When authentication is added later, this header is replaced by the auth token (JWT) and the routes stay the same.

| # | Method | Path | Purpose |
| --- | --- | --- | --- |
| 1 | `GET` | `/portfolio` | account value, available cash, positions |
| 2 | `GET` | `/instruments?q=` | search instruments by ticker or name |
| 3 | `POST` | `/orders` | send an order (`BUY`/`SELL`, `MARKET`/`LIMIT`) |
| 4 | `DELETE` | `/orders/:orderId` | cancel a `NEW` order |

> **Detailed sequence diagrams** (one per endpoint, through the hexagonal layers) live in
> [`sequence-diagrams/`](./sequence-diagrams/README.md).

## 1. Portfolio

Composes positions/cash (from `orders`) with prices (from `instruments`).

```mermaid
sequenceDiagram
  participant C as Client
  participant Ctrl as PortfolioController
  participant UC as GetPortfolio
  participant O as GetHoldings
  participant Q as GetLatestQuote
  participant DB as Postgres

  C->>Ctrl: GET /portfolio (X-User-Id)
  Ctrl->>UC: execute(userId)

  UC->>O: getHoldings(userId)
  O->>DB: read FILLED orders
  DB-->>O: positions + cash
  O-->>UC: positions + cash

  UC->>Q: getLatestQuote(each instrument)
  Q->>DB: read latest marketdata
  DB-->>Q: close + previousClose
  Q-->>UC: close + previousClose

  UC-->>Ctrl: value, cash, positions + return
  Ctrl-->>C: portfolio DTO
```

### Portfolio calculation

- **Available cash** = Σ `CASH_IN(size)` − Σ `CASH_OUT(size)` − Σ `BUY(size × price)` + Σ `SELL(size × price)` (from `FILLED` orders).
- **Position quantity** (per instrument) = Σ `BUY(size)` − Σ `SELL(size)` (from `FILLED` orders).
- **Market value** = quantity × `close`.
- **Return %** = `(close − previousClose) / previousClose × 100`.
- **Total account value** = available cash + Σ market values.

> **Assumption**: "rendimiento total (%)" is interpreted as the **daily return** (`close` vs `previousClose`).

## 2. Search instruments

```mermaid
sequenceDiagram
  participant C as Client
  participant Ctrl as InstrumentsController
  participant UC as SearchInstruments
  participant R as InstrumentRepository
  participant DB as Postgres

  C->>Ctrl: GET /instruments?q=query
  Ctrl->>UC: execute(query)
  UC->>R: search(query)
  R->>DB: query instruments (ticker/name)
  DB-->>R: rows
  R-->>UC: instruments[]
  UC-->>Ctrl: instruments[]
  Ctrl-->>C: instruments DTO[]
```

## 3. Send order

The core flow: place an order and decide its status.

```mermaid
sequenceDiagram
  participant C as Client
  participant Ctrl as OrdersController
  participant UC as PlaceOrder
  participant Q as QuoteProvider
  participant R as OrderRepository
  participant DB as Postgres

  C->>Ctrl: POST /orders (X-User-Id)
  Ctrl->>UC: execute(userId, input)

  opt type = MARKET
    UC->>Q: getLatestQuote(instrumentId)
    Q->>DB: read latest marketdata
    DB-->>Q: close + previousClose
    Q-->>UC: close + previousClose
  end

  UC->>R: available cash / held shares
  R->>DB: read FILLED orders
  DB-->>R: balances
  R-->>UC: balances

  alt insufficient
    UC->>R: save(REJECTED)
  else type = MARKET
    UC->>R: save(FILLED)
  else type = LIMIT
    UC->>R: save(NEW)
  end
  R->>DB: insert order
  DB-->>R: order
  R-->>UC: order

  UC-->>Ctrl: result
  Ctrl-->>C: order DTO
```

## 4. Cancel order

```mermaid
sequenceDiagram
  participant C as Client
  participant Ctrl as OrdersController
  participant UC as CancelOrder
  participant R as OrderRepository
  participant DB as Postgres

  C->>Ctrl: DELETE /orders/:orderId (X-User-Id)
  Ctrl->>UC: execute(userId, orderId)
  UC->>R: findOrder(orderId, userId)
  R->>DB: read order
  DB-->>R: order
  R-->>UC: order

  alt status = NEW
    UC->>R: update status to CANCELLED
    R->>DB: update order status
    DB-->>R: order (CANCELLED)
    R-->>UC: order (CANCELLED)
  else status != NEW
    UC-->>Ctrl: error (409)
  end

  UC-->>Ctrl: result
  Ctrl-->>C: order DTO
```

## Notes

- **`X-User-Id`** identifies the user (no auth). Replaced by JWT when auth is added.
- **`size` or `amount`**: the order body accepts an exact share count (`size`) or a total in ARS (`amount`); the use case computes `size = floor(amount / price)` when `amount` is given.
- **MARKET** uses the last `close`; **LIMIT** requires `price`.
- **Insufficient** → saved as `REJECTED` (BUY validates cash, SELL validates held shares).
- **Cancel** only works on `NEW` orders; otherwise it returns a conflict error (409).
- **Idempotency** → `POST /orders` accepts the `Idempotency-Key` header: if the server has already seen that key, it returns the original order instead of duplicating it.
- See [`order-lifecycle.md`](./order-lifecycle.md) for the state machine.
