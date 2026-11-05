# `GET /instruments?q=` — search

Searches instruments by `ticker` or `name` (partial, case-insensitive).

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant CTRL as InstrumentsController
    participant UC as SearchInstrumentsUseCase
    participant REPO as TypeOrmInstrumentRepository
    participant DB as Postgres

    C->>CTRL: GET /instruments?q=ypf
    Note over CTRL: ValidationPipe (whitelist) + transform<br/>SearchInstrumentsQueryDto: q trimmed, MinLength(1)
    CTRL->>UC: execute(q)
    UC->>REPO: search(q)
    REPO->>DB: SELECT * FROM instruments<br/>WHERE ticker ILIKE '%ypf%' OR name ILIKE '%ypf%'
    DB-->>REPO: InstrumentOrmEntity[]
    Note over REPO: map → Domain Instrument[]
    REPO-->>UC: Instrument[]
    UC-->>CTRL: Instrument[]
    Note over CTRL: InstrumentDto.fromDomain (no money conversion)
    CTRL-->>C: 200 InstrumentDto[]
```

## Notes

- `SearchInstrumentsUseCase` is a passthrough: no business rules, it just delegates to the
  `out` port `InstrumentRepository`.
- The search is an `OR` between `ticker` and `name`, using `ILIKE` (case-insensitive).
