import type { Order, OrderType, TradeSide } from "../../models/order";

export interface PlaceOrderInput {
  readonly userId: number;
  readonly instrumentId: number;
  readonly side: TradeSide;
  readonly type: OrderType;
  readonly size?: number;
  readonly amount?: number;
  readonly price?: number;
  readonly idempotencyKey?: string;
}

export interface PlaceOrder {
  execute(input: PlaceOrderInput): Promise<Order>;
}

export const PLACE_ORDER = Symbol("PLACE_ORDER");
