---
name: add-use-case
description: Use when adding a use case and/or HTTP endpoint to an existing module in this NestJS hexagonal repo — defining an in-port, implementing the use case, wiring it in the module, adding a controller + DTO, and tests. Triggers: "add use case", "new endpoint", "caso de uso", "nuevo endpoint", "add route", "add controller".
---

# Add a use case / endpoint

The domain and application layers must not know the transport. The controller is just an adapter.

## Steps

1. **In-port** (`<module>/domain/ports/in/<name>.ts`):

   ```ts
   export interface X {
     execute(input: XInput): Promise<XResult>;
   }
   export const X = Symbol("X");
   ```

   Use flat input/output types; never leak HTTP.

2. **Use case** (`<module>/application/use-cases/<name>.use-case.ts`): `@Injectable()`, implement `X`, inject out-ports with `@Inject(TOKEN)`. Orchestrate domain + ports; throw `DomainError` subclasses for business failures.

3. **Wire it** in `<module>.module.ts`: `{ provide: X, useClass: XUseCase }`.

4. **Controller** (`<module>/infrastructure/http/<module>.controller.ts`): inject the in-port token, map HTTP ↔ use-case input, return a response DTO. Add `@ApiOperation`, `@ApiResponse` (success type + `ErrorResponseDto` for 400/404/409).

5. **DTO(s)**: input with class-validator + `@ApiProperty`; separate response DTO for what you expose.

6. **Tests**: unit with in-memory fakes of the out-ports; add/extend e2e if it touches persistence or the HTTP pipeline.

## Rules

- Return a **typed outcome** from repositories (e.g. applied / insufficient / duplicate) and translate it to `DomainError` in the use case — don't throw business rules from the repository.
- Keep the controller thin: no business logic, no `try/catch` (global filters handle errors).
- If the use case needs another module, depend on a **local out-port** implemented by an adapter, not on the other module's types.

## Checklist

- [ ] In-port has a `Symbol` token; it's provided in the module.
- [ ] Use case imports only domain + port interfaces.
- [ ] Controller validates input (DTO) and documents responses.
- [ ] Domain rules covered by unit tests; pipeline/persistence by e2e.
- [ ] `npm run typecheck && npm run lint && npm test && npm run test:e2e` pass.
