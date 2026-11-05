import { Inject, Injectable, Optional } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { OrderNotFoundError } from "../../domain/errors/order-not-found.error";
import { OrderNotCancellableError } from "../../domain/errors/order-not-cancellable.error";
import { OrderStatus, type Order } from "../../domain/models/order";
import type { CancelOrder } from "../../domain/ports/in/cancel-order.port";
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from "../../domain/ports/out/order-repository.port";

@Injectable()
export class CancelOrderUseCase implements CancelOrder {
  public constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Optional()
    @InjectPinoLogger(CancelOrderUseCase.name)
    private readonly logger?: PinoLogger,
  ) {}

  public async execute(userId: number, orderId: number): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);

    if (order?.userId !== userId) {
      throw new OrderNotFoundError(orderId);
    }

    if (order.status !== OrderStatus.NEW) {
      throw new OrderNotCancellableError(orderId, order.status);
    }

    const cancelled = await this.orderRepository.updateStatus(
      orderId,
      OrderStatus.CANCELLED,
    );

    this.logger?.info(
      { orderId, userId, status: OrderStatus.CANCELLED },
      "order cancelled",
    );

    return cancelled;
  }
}
