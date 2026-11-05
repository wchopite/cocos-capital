import type { Order } from "../../models/order";

export interface CancelOrder {
  execute(userId: number, orderId: number): Promise<Order>;
}

export const CANCEL_ORDER = Symbol("CANCEL_ORDER");
