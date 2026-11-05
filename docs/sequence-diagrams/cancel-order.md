# `DELETE /orders/:orderId` — cancel

Cancels an order: only `NEW → CANCELLED`. Domain errors → envelope via `DomainExceptionFilter`.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant CTRL as OrdersController
    participant UC as CancelOrderUseCase
    participant OR as TypeOrmOrderRepository
    participant DB as Postgres
    participant F as DomainExceptionFilter

    C->>CTRL: DELETE /orders/:orderId<br/>X-User-Id
    Note over CTRL: orderId via ParseIntPipe
    CTRL->>UC: execute(userId, orderId)

    UC->>OR: findById(orderId)
    OR->>DB: SELECT ... WHERE id = $1
    DB-->>OR: OrderOrmEntity | null

    alt not found OR not the user's order (order.userId ≠ userId)
        Note over UC: never leak another user's orders
        UC-->>CTRL: throw OrderNotFoundError
        CTRL-->>F: DomainError
        F-->>C: 404 { statusCode, error, message, requestId }
    else status ≠ NEW
        UC-->>CTRL: throw OrderNotCancellableError(orderId, status)
        CTRL-->>F: DomainError
        F-->>C: 409 { statusCode, error, message, requestId }
    else status = NEW
        UC->>OR: updateStatus(orderId, CANCELLED)
        OR->>DB: UPDATE orders SET status = 'CANCELLED' WHERE id = $1
        OR->>DB: SELECT ... WHERE id = $1
        DB-->>OR: updated order
        OR-->>UC: Order
        UC-->>CTRL: Order
        Note over CTRL: OrderDto.fromDomain
        CTRL-->>C: 200 OrderDto
    end
```

## Notes

- **`order.userId ≠ userId` is treated as `404`** (not `403`): it must not reveal the existence
  of other users' orders.
- `OrderNotCancellableError` applies only to states other than `NEW`.
- The `DomainError.code → HTTP` mapping is resolved by the global filter, not by the controller.
