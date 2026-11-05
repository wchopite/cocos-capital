import { OrderNotFoundError } from "../../domain/errors/order-not-found.error";
import { OrderNotCancellableError } from "../../domain/errors/order-not-cancellable.error";
import {
  OrderSide,
  OrderStatus,
  OrderType,
  type Order,
} from "../../domain/models/order";
import type { OrderRepository } from "../../domain/ports/out/order-repository.port";
import { CancelOrderUseCase } from "./cancel-order.use-case";

function makeOrder(overrides: Partial<Order>): Order {
  return {
    id: 1,
    instrumentId: 47,
    userId: 1,
    side: OrderSide.BUY,
    type: OrderType.LIMIT,
    status: OrderStatus.NEW,
    size: 10,
    price: 92000,
    datetime: new Date(),
    ...overrides,
  };
}

function createRepo(overrides: Partial<OrderRepository>): OrderRepository {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findFilledByUser: jest.fn(),
    findByIdempotencyKey: jest.fn(),
    updateStatus: jest.fn(),
    withUserLock: jest.fn(),
    ...overrides,
  };
}

describe("CancelOrderUseCase", () => {
  it("cancels a NEW order", async () => {
    const updateStatus = jest
      .fn()
      .mockResolvedValue(makeOrder({ status: OrderStatus.CANCELLED }));
    const repo = createRepo({
      findById: jest.fn().mockResolvedValue(makeOrder({})),
      updateStatus,
    });
    const useCase = new CancelOrderUseCase(repo);

    const order = await useCase.execute(1, 1);

    expect(updateStatus).toHaveBeenCalledWith(1, OrderStatus.CANCELLED);
    expect(order.status).toBe(OrderStatus.CANCELLED);
  });

  it("throws when the order is not NEW", async () => {
    const repo = createRepo({
      findById: jest
        .fn()
        .mockResolvedValue(makeOrder({ status: OrderStatus.FILLED })),
    });
    const useCase = new CancelOrderUseCase(repo);

    await expect(useCase.execute(1, 1)).rejects.toThrow(
      OrderNotCancellableError,
    );
  });

  it("throws when the order does not exist", async () => {
    const repo = createRepo({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new CancelOrderUseCase(repo);

    await expect(useCase.execute(1, 999)).rejects.toThrow(OrderNotFoundError);
  });

  it("throws when the order belongs to another user", async () => {
    const repo = createRepo({
      findById: jest.fn().mockResolvedValue(makeOrder({ userId: 2 })),
    });
    const useCase = new CancelOrderUseCase(repo);

    await expect(useCase.execute(1, 1)).rejects.toThrow(OrderNotFoundError);
  });
});
