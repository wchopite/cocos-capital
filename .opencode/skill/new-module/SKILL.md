---
name: new-module
description: Use when adding a new module to this NestJS hexagonal repo — an `instruments`/`orders`/`portfolio`-like module under src/ with domain, application, infrastructure, ports, persistence, and a controller, registered in app.module.ts. Triggers: "new module", "nuevo módulo", "scaffold module", "add context".
---

# Add a new module

Mirror the existing `instruments`/`orders`/`portfolio` layout. Keep the domain pure (no Nest, TypeORM, or HTTP).

## Structure

```
src/<module>/
  domain/
    models/        pure types + invariants (functions)
    errors/        extend DomainError (shared/domain/errors/domain.error.ts)
    ports/
      in/          interfaces + Symbol tokens (what the module offers)
      out/         interfaces + Symbol tokens (what the module needs)
  application/use-cases/     orchestrate domain + ports (import interfaces only)
  infrastructure/
    persistence/{entities,mappers,repositories}/
    http/          controller + dto
    <integration>/ adapters to other modules
  <module>.module.ts
```

## Steps

1. `domain/models`: readonly types; put invariants in pure functions.
2. `domain/errors`: extend `DomainError` with a `DomainErrorCode` and a `details` map.
3. `domain/ports/in`: one interface + `export const X = Symbol('X')` per use case.
4. `domain/ports/out`: one interface + token per dependency (repository, external contract).
5. `application/use-cases`: implement ports `in`; inject ports `out` with `@Inject(TOKEN)`. Domain rules live here. Never import `infrastructure`.
6. `infrastructure/persistence`: `<x>.orm-entity.ts`, a mapper (`toDomain` / `toOrm`), and a repository implementing the out-port.
7. `infrastructure/http`: controller + DTO (class-validator + `@ApiProperty`) + `@ApiResponse` (use `ErrorResponseDto` for errors).
8. `<module>.module.ts`: wire `{ provide: TOKEN, useClass: Impl }` for every port; declare controllers; export only the ports `in` other modules need.
9. Register the module in `app.module.ts`.
10. Migration in `src/shared/infrastructure/database/migrations/` (`DB_SYNCHRONIZE=false`).
11. Tests: unit for domain + use cases (in-memory fakes); e2e if it touches persistence/HTTP.

## Checklist

- [ ] `domain` imports nothing from `application`/`infrastructure`/Nest/TypeORM.
- [ ] Every port has a `Symbol` token and a provider in the module.
- [ ] Entities are mapped; the domain never sees an entity.
- [ ] Cross-module access goes through a published contract + adapter.
- [ ] `npm run typecheck && npm run lint && npm test && npm run test:e2e` pass.
- [ ] New endpoints are documented in Swagger.
