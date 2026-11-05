import { Inject, Injectable } from "@nestjs/common";
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
  ) {}

  public async execute(input: PlaceOrderInput): Promise<Order> {
    if (input.idempotencyKey !== undefined) {
      const existing = await this.orderRepository.findByIdempotencyKey(
        input.idempotencyKey,
      );
      if (existing !== null) {
        return existing;
      }
    }

    const price =
      input.type === OrderType.MARKET
        ? (await this.quoteProvider.getLatestQuote(input.instrumentId)).price
        : input.price!;

    const size = input.size ?? Math.floor(input.amount! / price);

    return this.orderRepository.withUserLock(
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
