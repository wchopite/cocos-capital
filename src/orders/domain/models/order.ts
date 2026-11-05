export const OrderSide = {
  BUY: "BUY",
  SELL: "SELL",
  CASH_IN: "CASH_IN",
  CASH_OUT: "CASH_OUT",
} as const;

export type OrderSide = (typeof OrderSide)[keyof typeof OrderSide];

export type TradeSide = (typeof OrderSide)["BUY" | "SELL"];

export const OrderType = {
  MARKET: "MARKET",
  LIMIT: "LIMIT",
} as const;

export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const OrderStatus = {
  NEW: "NEW",
  FILLED: "FILLED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

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
