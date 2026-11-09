# Data model

PostgreSQL schema (SERIAL primary keys). See [`sql/database.sql`](../sql/database.sql).

```mermaid
erDiagram
  USERS ||--o{ ORDERS : "places"
  INSTRUMENTS ||--o{ ORDERS : "traded as"
  INSTRUMENTS ||--o{ MARKETDATA : "has prices"

  USERS {
    serial id PK
    varchar email
    varchar accountNumber
  }

  INSTRUMENTS {
    serial id PK
    varchar ticker
    varchar name
    varchar type
  }

  ORDERS {
    serial id PK
    int instrumentId FK
    int userId FK
    int size
    numeric price
    varchar type
    varchar side
    varchar status
    timestamp datetime
    varchar currency
    varchar idempotencyKey
  }

  MARKETDATA {
    serial id PK
    int instrumentId FK
    numeric high
    numeric low
    numeric open
    numeric close
    numeric previousClose
    date date
  }
```

## Notes

- **`size`'s meaning depends on `side`**: for `BUY`/`SELL` it is the number of shares; for `CASH_IN`/`CASH_OUT` it is the amount in ARS (with `price = 1`).
- **`instruments.type`**: `ACCIONES` (stocks) or `MONEDA` (currency). ARS is `MONEDA` (id 66), USD is `MONEDA` (id 67).
- **`orders` is the ledger**: positions and cash are derived from `FILLED` orders (there is no materialized balance table). Cash is tracked per currency (`orders.currency`), accumulated by `computeHoldings`.
- **`marketdata.date`** is `DATE` (not `datetime` as the challenge prose said).
- **Schema improvements (migrations)**: CHECK constraints on `side`/`type`/`status`, indexes on `orders.userId`, `orders.status`, `marketdata.instrumentId`, and a unique index on `orders.idempotencyKey` (nullable; enables idempotent order placement).
