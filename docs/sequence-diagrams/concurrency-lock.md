# Concurrency — per-user pessimistic lock

Two `MARKET` orders from the **same user** arriving at the same time. Without the lock,
both would read `$100` cash and spend `$80` each → overdraft. `SELECT ... FOR UPDATE`
serializes them; the second one reads the updated cash and gets `REJECTED`.

```mermaid
sequenceDiagram
    autonumber
    participant A as Client (request A)
    participant B as Client (request B)
    participant UC as PlaceOrderUseCase
    participant OR as TypeOrmOrderRepository
    participant DB as Postgres

    par two concurrent requests, same user
        A->>UC: execute(BUY size 1 @ $80)
        UC->>OR: withUserLock(userId, work)
        OR->>DB: BEGIN
        OR->>DB: SELECT id FROM users WHERE id = $1 FOR UPDATE
        Note over DB: request A acquires the lock
        OR->>DB: SELECT FILLED orders → availableCash = $100
        Note over UC: $100 ≥ $80 → FILLED
        UC->>OR: save(FILLED)
        OR->>DB: INSERT (cash is now $20)
        OR->>DB: COMMIT
        OR-->>UC: Order (FILLED)
        UC-->>A: 201 FILLED
    and
        B->>UC: execute(BUY size 1 @ $80)
        UC->>OR: withUserLock(userId, work)
        OR->>DB: BEGIN
        OR->>DB: SELECT id FROM users WHERE id = $1 FOR UPDATE
        Note over DB: request B blocks until A commits
        OR->>DB: SELECT FILLED orders → availableCash = $20
        Note over UC: $20 < $80 → REJECTED
        UC->>OR: save(REJECTED)
        OR->>DB: INSERT (REJECTED, no cash moved)
        OR->>DB: COMMIT
        OR-->>UC: Order (REJECTED)
        UC-->>B: 201 REJECTED
    end
```

## Notes

- The invariant is **per user** ("never go negative, never sell what you don't own"). Locking
  the `users` row serializes all of that user's order placements; different users never block
  each other.
- `withUserLock` is an `OrderRepository` port: the use case does not know *how* the lock is
  implemented. Extracting `orders` to its own service only swaps the lock implementation
  (e.g. `pg_advisory_xact_lock(userId)`), not `PlaceOrder`.
- This is exactly what the e2e concurrency test covers: two simultaneous orders → one `FILLED`
  + one `REJECTED`.
