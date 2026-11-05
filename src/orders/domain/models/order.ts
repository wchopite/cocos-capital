export type OrderSide = "BUY" | "SELL" | "CASH_IN" | "CASH_OUT";
export type TradeSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";
export type OrderStatus = "NEW" | "FILLED" | "REJECTED" | "CANCELLED";

export interface Order {
  readonly id?: number;
  readonly instrumentId: number;
  readonly userId: number;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly status: OrderStatus;
  readonly size: number;
  readonly price: number;
  readonly datetime: Date;
  readonly idempotencyKey?: string;
}
