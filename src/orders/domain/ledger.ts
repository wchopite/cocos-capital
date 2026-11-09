import type { Currency } from "../../shared/domain/currency";
import type { Holdings, Position } from "./models/holdings";
import { OrderSide, type Order } from "./models/order";

export function computeHoldings(orders: Order[]): Holdings {
  const cash: Record<Currency, number> = { ARS: 0, USD: 0 };
  const quantities = new Map<number, number>();

  for (const order of orders) {
    switch (order.side) {
      case OrderSide.CASH_IN:
        cash[order.currency] += order.size;
        break;
      case OrderSide.CASH_OUT:
        cash[order.currency] -= order.size;
        break;
      case OrderSide.BUY:
        cash[order.currency] -= order.size * order.price;
        quantities.set(
          order.instrumentId,
          (quantities.get(order.instrumentId) ?? 0) + order.size,
        );
        break;
      case OrderSide.SELL:
        cash[order.currency] += order.size * order.price;
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

  return { cash, positions };
}
