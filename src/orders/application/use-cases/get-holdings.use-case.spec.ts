import {
  OrderSide,
  OrderStatus,
  OrderType,
  type Order,
} from "../../domain/models/order";
import type { OrderRepository } from "../../domain/ports/out/order-repository.port";
import { GetHoldingsUseCase } from "./get-holdings.use-case";

describe("GetHoldingsUseCase", () => {
  it("returns holdings computed from FILLED orders", async () => {
    const orders: Order[] = [
      {
        instrumentId: 66,
        userId: 1,
        side: OrderSide.CASH_IN,
        type: OrderType.MARKET,
        status: OrderStatus.FILLED,
        size: 100000000,
        price: 100,
        currency: "ARS",
        datetime: new Date(),
      },
      {
        instrumentId: 47,
        userId: 1,
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        status: OrderStatus.FILLED,
        size: 50,
        price: 93000,
        currency: "ARS",
        datetime: new Date(),
      },
    ];
    const findFilledByUser = jest.fn().mockResolvedValue(orders);
    const repo: OrderRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findFilledByUser,
      findByIdempotencyKey: jest.fn(),
      updateStatus: jest.fn(),
      withUserLock: jest.fn(),
    };
    const useCase = new GetHoldingsUseCase(repo);

    const holdings = await useCase.execute(1);

    expect(findFilledByUser).toHaveBeenCalledWith(1);
    expect(holdings.cash.ARS).toBe(95350000);
    expect(holdings.positions).toEqual([{ instrumentId: 47, quantity: 50 }]);
  });
});
