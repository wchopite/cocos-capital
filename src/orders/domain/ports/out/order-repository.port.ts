import type { Order, OrderStatus } from "../../models/order";

export interface UserLockContext {
  readonly filledOrders: Order[];
  save(order: Order): Promise<Order>;
}

export interface OrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: number): Promise<Order | null>;
  findFilledByUser(userId: number): Promise<Order[]>;
  findByIdempotencyKey(key: string): Promise<Order | null>;
  updateStatus(id: number, status: OrderStatus): Promise<Order>;
  withUserLock<T>(
    userId: number,
    work: (ctx: UserLockContext) => Promise<T>,
  ): Promise<T>;
}

export const ORDER_REPOSITORY = Symbol("ORDER_REPOSITORY");
