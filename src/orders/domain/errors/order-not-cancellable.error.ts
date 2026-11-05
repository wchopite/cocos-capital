import { DomainError } from "../../../shared/domain/errors/domain.error";
import type { OrderStatus } from "../models/order";

export class OrderNotCancellableError extends DomainError {
  public constructor(orderId: number, status: OrderStatus) {
    super({
      code: "ORDER_NOT_CANCELLABLE",
      message: `Order ${orderId} cannot be cancelled (status: ${status})`,
      statusCode: 409,
    });
  }
}
