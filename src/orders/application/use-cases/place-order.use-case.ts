import { Inject, Injectable, Optional } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { computeHoldings } from "../../domain/ledger";
import {
  OrderSide,
  OrderStatus,
  OrderType,
  type Order,
} from "../../domain/models/order";
import type {
  PlaceOrder,
  PlaceOrderInput,
} from "../../domain/ports/in/place-order.port";
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from "../../domain/ports/out/order-repository.port";
import {
  QUOTE_PROVIDER,
  type QuoteProvider,
} from "../../domain/ports/out/quote-provider.port";

@Injectable()
export class PlaceOrderUseCase implements PlaceOrder {
  public constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(QUOTE_PROVIDER)
    private readonly quoteProvider: QuoteProvider,
    @Optional()
    @InjectPinoLogger(PlaceOrderUseCase.name)
    private readonly logger?: PinoLogger,
  ) {}

  public async execute(input: PlaceOrderInput): Promise<Order> {
    if (input.idempotencyKey !== undefined) {
      const existing = await this.orderRepository.findByIdempotencyKey(
        input.idempotencyKey,
      );
      if (existing !== null) {
        this.logger?.debug(
          { orderId: existing.id, idempotencyKey: input.idempotencyKey },
          "order replayed from idempotency key",
        );
        return existing;
      }
    }

    const price =
      input.type === OrderType.MARKET
        ? (await this.quoteProvider.getLatestQuote(input.instrumentId)).price
        : input.price!;

    const size = input.size ?? Math.floor(input.amount! / price);

    const order = await this.orderRepository.withUserLock(
      input.userId,
      async ({ filledOrders, save }) => {
        const status = this.decideStatus(input, size, price, filledOrders);

        return save({
          instrumentId: input.instrumentId,
          userId: input.userId,
          side: input.side,
          type: input.type,
          status,
          size,
          price,
          datetime: new Date(),
          idempotencyKey: input.idempotencyKey,
        });
      },
    );

    this.logger?.info(
      {
        orderId: order.id,
        userId: order.userId,
        instrumentId: order.instrumentId,
        side: order.side,
        type: order.type,
        status: order.status,
        size: order.size,
        price: order.price,
      },
      "order placed",
    );

    return order;
  }

  private decideStatus(
    input: PlaceOrderInput,
    size: number,
    price: number,
    filledOrders: Order[],
  ): OrderStatus {
    const holdings = computeHoldings(filledOrders);

    const sufficient =
      input.side === OrderSide.BUY
        ? holdings.availableCash >= size * price
        : (holdings.positions.find((p) => p.instrumentId === input.instrumentId)
            ?.quantity ?? 0) >= size;

    if (!sufficient) {
      return OrderStatus.REJECTED;
    }

    return input.type === OrderType.MARKET
      ? OrderStatus.FILLED
      : OrderStatus.NEW;
  }
}
