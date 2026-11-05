import { computeHoldings } from "./ledger";
import { OrderSide, OrderStatus, OrderType, type Order } from "./models/order";

function makeOrder(overrides: Partial<Order>): Order {
  return {
    instrumentId: 47,
    userId: 1,
    side: OrderSide.BUY,
    type: OrderType.MARKET,
    status: OrderStatus.FILLED,
    size: 10,
    price: 93000,
    datetime: new Date(),
    ...overrides,
  };
}

describe("computeHoldings", () => {
  it("computes available cash and positions", () => {
    const orders = [
      makeOrder({
        instrumentId: 66,
        side: OrderSide.CASH_IN,
        size: 100000000,
        price: 100,
      }),
      makeOrder({
        instrumentId: 47,
        side: OrderSide.BUY,
        size: 50,
        price: 93000,
      }),
      makeOrder({
        instrumentId: 47,
        side: OrderSide.SELL,
        size: 10,
        price: 94000,
      }),
    ];

    const holdings = computeHoldings(orders);

    expect(holdings.availableCash).toBe(96290000);
    expect(holdings.positions).toEqual([{ instrumentId: 47, quantity: 40 }]);
  });

  it("filters out zero-quantity positions", () => {
    const orders = [
      makeOrder({ instrumentId: 47, side: OrderSide.BUY, size: 10 }),
      makeOrder({ instrumentId: 47, side: OrderSide.SELL, size: 10 }),
    ];

    expect(computeHoldings(orders).positions).toEqual([]);
  });
});
