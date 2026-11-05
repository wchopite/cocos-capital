import type { Holdings, Position } from "./models/holdings";
import { OrderSide, type Order } from "./models/order";

export function computeHoldings(orders: Order[]): Holdings {
  let availableCash = 0;
  const quantities = new Map<number, number>();

  for (const order of orders) {
    switch (order.side) {
      case OrderSide.CASH_IN:
        availableCash += order.size;
        break;
      case OrderSide.CASH_OUT:
        availableCash -= order.size;
        break;
      case OrderSide.BUY:
        availableCash -= order.size * order.price;
        quantities.set(
          order.instrumentId,
          (quantities.get(order.instrumentId) ?? 0) + order.size,
        );
        break;
      case OrderSide.SELL:
        availableCash += order.size * order.price;
        quantities.set(
          order.instrumentId,
          (quantities.get(order.instrumentId) ?? 0) - order.size,
        );
        break;
    }
  }

  const positions: Position[] = [...quantities.entries()]
    .filter(([, quantity]) => quantity !== 0)
    .map(([instrumentId, quantity]) => ({ instrumentId, quantity }));

  return { availableCash, positions };
}
