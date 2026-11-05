# `GET /portfolio` — account valuation

Builds the portfolio: cash plus positions with market value and daily return. Combines
`orders` (holdings) and `instruments` (quotes) through cross-module adapters.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant CTRL as PortfolioController
    participant UC as GetPortfolioUseCase
    participant HA as OrdersHoldingsAdapter<br/>(portfolio → orders)
    participant HUC as GetHoldingsUseCase
    participant OR as TypeOrmOrderRepository
    participant QA as InstrumentsQuoteAdapter<br/>(portfolio → instruments)
    participant QUC as GetLatestQuoteUseCase
    participant MR as TypeOrmMarketDataRepository
    participant DB as Postgres

    C->>CTRL: GET /portfolio<br/>X-User-Id
    CTRL->>UC: execute(userId)

    UC->>HA: getHoldings(userId)
    HA->>HUC: execute(userId)
    HUC->>OR: findFilledByUser(userId)
    OR->>DB: SELECT * FROM orders<br/>WHERE user_id = $1 AND status = 'FILLED'
    DB-->>OR: OrderOrmEntity[]
    Note over OR: map → Domain Order[]
    OR-->>HUC: Order[]
    Note over HUC: computeHoldings(orders) → { availableCash, positions }
    HUC-->>HA: Holdings
    HA-->>UC: { availableCash, positions }

    loop for each position (instrumentId)
        UC->>QA: getLatestQuote(instrumentId)
        QA->>QUC: execute(instrumentId)
        QUC->>MR: findLatestQuote(instrumentId)
        MR->>DB: SELECT ... WHERE instrument_id = $1<br/>ORDER BY date DESC, id DESC LIMIT 1
        DB-->>MR: MarketDataOrmEntity
        Note over MR: toQuote → close/previousClose (cents)
        MR-->>QUC: Quote
        QUC-->>QA: Quote
        QA-->>UC: { instrumentId, close, previousClose }
        Note over UC: quotes.set(instrumentId, quote)
    end

    Note over UC: computePortfolio(holdings, quotes)
    Note over UC: filter quantity ≤ 0 · marketValue = qty × close<br/>dailyReturn = (close − previousClose) / previousClose × 100<br/>totalValue = availableCash + Σ marketValue
    UC-->>CTRL: Portfolio
    Note over CTRL: PortfolioDto.fromDomain → fromCents(...)
    CTRL-->>C: 200 PortfolioDto
```

## Notes

- **Two dependencies** (`HoldingsProvider` and `QuoteProvider`), both satisfied by adapters
  toward `orders` and `instruments`. The `portfolio` domain does not know those modules.
- **`quantity ≤ 0` is filtered**: the "short" in the seed (instrument 31, `BUY 20 − SELL 30 = −10`)
  is excluded from the valuation (positions you don't own are not shown).
- **`dailyReturn`** is daily (`close` vs `previousClose`), in %, rounded to 2 decimals.
  `previousClose = 0` → return `0` (no division by zero).
- N+1 quotes: one query per position; acceptable at this size (see `interview-prep.md §2`
  for the composite index and read-model as the evolution path).
