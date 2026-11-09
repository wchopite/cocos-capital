import {
  OrderSide,
  OrderStatus,
  OrderType,
  type Order,
} from "../../domain/models/order";
import type {
  OrderRepository,
  UserLockContext,
} from "../../domain/ports/out/order-repository.port";
import type { QuoteProvider } from "../../domain/ports/out/quote-provider.port";
import { PlaceOrderUseCase } from "./place-order.use-case";

interface Fakes {
  repo: OrderRepository;
  quoteProvider: QuoteProvider;
}

function createFakes(filledOrders: Order[] = []): Fakes {
  let nextId = 1;
  const byIdempotencyKey = new Map<string, Order>();

  const save = (order: Order): Promise<Order> => {
    const persisted = { ...order, id: nextId++ };
    if (order.idempotencyKey !== undefined) {
      byIdempotencyKey.set(order.idempotencyKey, persisted);
    }
    return Promise.resolve(persisted);
  };

  const withUserLock = <T>(
    _userId: number,
    work: (ctx: UserLockContext) => Promise<T>,
  ): Promise<T> => work({ filledOrders, save });

  const repo: OrderRepository = {
    save,
    findById: jest.fn().mockResolvedValue(null),
    findFilledByUser: jest.fn().mockResolvedValue(filledOrders),
    findByIdempotencyKey: jest
      .fn()
      .mockImplementation((key: string) =>
        Promise.resolve(byIdempotencyKey.get(key) ?? null),
      ),
    updateStatus: jest.fn(),
    withUserLock,
  };

  const quoteProvider: QuoteProvider = {
    getLatestQuote: jest.fn().mockResolvedValue({
      instrumentId: 47,
      price: 93000,
      asOf: "2023-07-14",
      currency: "ARS",
    }),
  };

  return { repo, quoteProvider };
}

function cashOrder(): Order {
  return {
    instrumentId: 66,
    userId: 1,
    side: OrderSide.CASH_IN,
    type: OrderType.MARKET,
    status: OrderStatus.FILLED,
    size: 100000000,
    price: 100,
    currency: "ARS",
    datetime: new Date(),
  };
}

describe("PlaceOrderUseCase", () => {
  it("fills a MARKET BUY at the last close", async () => {
    const { repo, quoteProvider } = createFakes([cashOrder()]);
    const useCase = new PlaceOrderUseCase(repo, quoteProvider);

    const order = await useCase.execute({
      userId: 1,
      instrumentId: 47,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      size: 10,
    });

    expect(order.status).toBe(OrderStatus.FILLED);
    expect(order.price).toBe(93000);
  });

  it("places a LIMIT BUY as NEW", async () => {
    const { repo, quoteProvider } = createFakes([cashOrder()]);
    const useCase = new PlaceOrderUseCase(repo, quoteProvider);

    const order = await useCase.execute({
      userId: 1,
      instrumentId: 47,
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      size: 10,
      price: 92000,
    });

    expect(order.status).toBe(OrderStatus.NEW);
    expect(order.price).toBe(92000);
  });

  it("rejects a BUY without enough cash", async () => {
    const { repo, quoteProvider } = createFakes();
    const useCase = new PlaceOrderUseCase(repo, quoteProvider);

    const order = await useCase.execute({
      userId: 1,
      instrumentId: 47,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      size: 10,
    });

    expect(order.status).toBe(OrderStatus.REJECTED);
  });

  it("rejects a SELL without enough shares", async () => {
    const { repo, quoteProvider } = createFakes();
    const useCase = new PlaceOrderUseCase(repo, quoteProvider);

    const order = await useCase.execute({
      userId: 1,
      instrumentId: 47,
      side: OrderSide.SELL,
      type: OrderType.MARKET,
      size: 10,
    });

    expect(order.status).toBe(OrderStatus.REJECTED);
  });

  it("computes size from a total amount", async () => {
    const { repo, quoteProvider } = createFakes([cashOrder()]);
    const useCase = new PlaceOrderUseCase(repo, quoteProvider);

    const order = await useCase.execute({
      userId: 1,
      instrumentId: 47,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      amount: 100000,
    });

    expect(order.size).toBe(1);
    expect(order.status).toBe(OrderStatus.FILLED);
  });

  it("returns the original order for a repeated idempotency key", async () => {
    const { repo, quoteProvider } = createFakes([cashOrder()]);
    const useCase = new PlaceOrderUseCase(repo, quoteProvider);

    const input = {
      userId: 1,
      instrumentId: 47,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      size: 10,
      idempotencyKey: "key-1",
    };

    const first = await useCase.execute(input);
    const second = await useCase.execute(input);

    expect(second.id).toBe(first.id);
  });
});
