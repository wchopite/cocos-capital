# Architecture

Hexagonal (ports & adapters) NestJS API with three modules. Arrow direction = "depends on".

## Modules

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

  PlaceOrder -->|"price"| GetLatestQuote
  GetPortfolio -->|"positions + cash"| GetHoldings
  GetPortfolio -->|"price"| GetLatestQuote
```

- `orders` needs the price from `instruments` (`QuoteProvider` port → `GetLatestQuote`).
- `portfolio` needs positions/cash from `orders` (`HoldingsProvider` → `GetHoldings`) and the price from `instruments` (`QuoteProvider` → `GetLatestQuote`).

## Layers (per module)

```
infrastructure → application → domain
```

- **domain** — pure types + invariants (no Nest, TypeORM, or HTTP).
- **application** — use cases; orchestrate domain + ports.
- **infrastructure** — persistence (TypeORM), HTTP controllers, adapters.

## Ports

| Module | in-ports (offers) | out-ports (needs) |
| --- | --- | --- |
| `instruments` | `SearchInstruments`, `GetLatestQuote` | `InstrumentRepository`, `MarketDataRepository` |
| `orders` | `PlaceOrder`, `CancelOrder`, `GetHoldings` | `OrderRepository`, `QuoteProvider` |
| `portfolio` | `GetPortfolio` | `HoldingsProvider`, `QuoteProvider` |

## Database

Tables: `users`, `instruments`, `orders`, `marketdata` (see [`sql/database.sql`](../sql/database.sql) and [`data-model.md`](./data-model.md)).

`orders` is the **ledger**: positions and cash are derived from `FILLED` orders.
