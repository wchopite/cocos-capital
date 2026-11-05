# `POST /orders` — LIMIT

A `LIMIT` order requires `price` and stays `NEW` (it is not executed on its own). If there
aren't enough funds/shares it ends `REJECTED`. It does not query a quote: it uses the
request `price`.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant CTRL as OrdersController
    participant UC as PlaceOrderUseCase
    participant OR as TypeOrmOrderRepository
    participant DB as Postgres

    C->>CTRL: POST /orders<br/>X-User-Id, Idempotency-Key<br/>{ instrumentId, side=BUY, type=LIMIT, size, price }
    Note over CTRL: ValidationPipe: price required only for LIMIT
    Note over CTRL: toCents(price) → PlaceOrderInput (cents)
    CTRL->>UC: execute(input)

    opt idempotencyKey present
        UC->>OR: findByIdempotencyKey(key)
        OR->>DB: SELECT ... WHERE idempotency_key = $1
        alt key already seen
            DB-->>OR: existing order
            OR-->>UC: Order (replay)
            UC-->>CTRL: Order
            CTRL-->>C: 201 OrderDto
            Note over UC,CTRL: end (idempotency)
        end
    end

    Note over UC: price = input.price (cents)<br/>size = input.size ?? floor(amount / price)

    UC->>OR: withUserLock(userId, work)
    OR->>DB: BEGIN
    OR->>DB: SELECT id FROM users WHERE id = $1 FOR UPDATE
    OR->>DB: SELECT * FROM orders<br/>WHERE user_id = $1 AND status = 'FILLED'
    DB-->>OR: filledOrders
    OR-->>UC: work({ filledOrders, save })
    Note over UC: holdings = computeHoldings(filledOrders)
    alt insufficient
        Note over UC: status = REJECTED (saved anyway)
    else sufficient
        Note over UC: status = NEW (LIMIT waits)
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

- **`LIMIT` does not reserve** cash or shares: available cash and held shares are computed
  only from `FILLED` orders. The sufficiency check here is "at placement time", not a hard reserve.
- **`NEW` → `CANCELLED`** is the only later path (see [`cancel-order.md`](./cancel-order.md)).
  There is no execution simulation (`NEW → FILLED` does not happen in the MVP).
- The per-user lock still applies: two simultaneous `LIMIT` orders from the same user are serialized too.
