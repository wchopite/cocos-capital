# `POST /orders` — MARKET

A `MARKET` order executes immediately at the last `close`. It ends `FILLED` or `REJECTED`
(insufficient funds/shares), and in both cases **it is saved**. Includes idempotency, a
cross-module quote, and the per-user pessimistic lock.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant CTRL as OrdersController
    participant UC as PlaceOrderUseCase
    participant QA as InstrumentsQuoteAdapter<br/>(orders → instruments)
    participant QUC as GetLatestQuoteUseCase
    participant MR as TypeOrmMarketDataRepository
    participant OR as TypeOrmOrderRepository
    participant DB as Postgres

    C->>CTRL: POST /orders<br/>X-User-Id, Idempotency-Key<br/>{ instrumentId, side=BUY, type=MARKET, size }
    Note over CTRL: ValidationPipe: whitelist + forbidNonWhitelisted + transform
    Note over CTRL: toCents(amount|price) → PlaceOrderInput (cents)
    CTRL->>UC: execute(input)

    opt idempotencyKey present
        UC->>OR: findByIdempotencyKey(key)
        OR->>DB: SELECT ... WHERE idempotency_key = $1
        alt key already seen
            DB-->>OR: existing order
            OR-->>UC: Order
            UC-->>CTRL: Order (replay, no duplicate)
            CTRL-->>C: 201 OrderDto
            Note over UC,CTRL: end (idempotency)
        else new key
            Note over UC: continue
        end
    end

    UC->>QA: getLatestQuote(instrumentId)
    QA->>QUC: execute(instrumentId)
    QUC->>MR: findLatestQuote(instrumentId)
    MR->>DB: SELECT ... WHERE instrument_id = $1<br/>ORDER BY date DESC, id DESC LIMIT 1
    DB-->>MR: MarketDataOrmEntity
    Note over MR: toQuote → close/previousClose (cents)
    MR-->>QUC: Quote
    alt no quote
        QUC-->>QA: throw InstrumentNotFoundError → 404
    else
        QUC-->>QA: Quote
    end
    QA-->>UC: { instrumentId, price: close, asOf }
    Note over UC: price = close (cents)

    Note over UC: size = input.size ?? floor(amount / price)

    UC->>OR: withUserLock(userId, work)
    OR->>DB: BEGIN
    OR->>DB: SELECT id FROM users WHERE id = $1 FOR UPDATE
    OR->>DB: SELECT * FROM orders<br/>WHERE user_id = $1 AND status = 'FILLED'
    DB-->>OR: filledOrders
    OR-->>UC: work({ filledOrders, save })
    Note over UC: holdings = computeHoldings(filledOrders)
    alt insufficient (BUY: cash < size × price)
        Note over UC: status = REJECTED (saved anyway)
    else sufficient
        Note over UC: status = FILLED (MARKET)
    end
    UC->>OR: save(order)
    OR->>DB: INSERT INTO orders (...)
    DB-->>OR: saved order
    OR->>DB: COMMIT
    OR-->>UC: Order
    UC-->>CTRL: Order
    Note over CTRL: OrderDto.fromDomain → price = fromCents(...)
    CTRL-->>C: 201 OrderDto
```

## Notes

- **Price**: `MARKET` does not take `price` in the request; it uses the `close` from `marketdata`.
- **Lock**: `SELECT ... FOR UPDATE` on `users` serializes the orders of **one** user
  (closes the read→validate→write race). Different users never block each other.
- **Derived**: sufficiency is computed with `computeHoldings` over the `FILLED` orders
  (there is no materialized balance column).
- **`REJECTED` is not thrown**: it is a use-case *outcome* that gets saved; only invariants
  (unknown instrument, etc.) throw a `DomainError`.
