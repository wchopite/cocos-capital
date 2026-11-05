import { DomainError } from "../../../shared/domain/errors/domain.error";

export class OrderNotFoundError extends DomainError {
  public constructor(orderId: number) {
    super({
      code: "ORDER_NOT_FOUND",
      message: `Order ${orderId} not found`,
      statusCode: 404,
    });
  }
}
