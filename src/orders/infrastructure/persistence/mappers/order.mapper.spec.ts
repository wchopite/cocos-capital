import {
  OrderSide,
  OrderStatus,
  OrderType,
} from "../../../domain/models/order";
import { OrderOrmEntity } from "../entities/order.orm-entity";
import { toDomain, toOrm } from "./order.mapper";

describe("order.mapper", () => {
  it("maps a BUY order to domain with cents", () => {
    const entity = {
      id: 1,
      instrumentId: 47,
      userId: 1,
      side: "BUY",
      type: "MARKET",
      status: "FILLED",
      size: 50,
      price: "930.00",
      currency: "ARS",
      datetime: new Date("2023-07-12T12:31:20Z"),
      idempotencyKey: null,
    } as OrderOrmEntity;

    const order = toDomain(entity);

    expect(order).toEqual({
      id: 1,
      instrumentId: 47,
      userId: 1,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      status: OrderStatus.FILLED,
      size: 50,
      price: 93000,
      currency: "ARS",
      datetime: entity.datetime,
      idempotencyKey: undefined,
    });
  });

  it("maps a CASH_IN order to domain with cents", () => {
    const entity = {
      id: 1,
      instrumentId: 66,
      userId: 1,
      side: "CASH_IN",
      type: "MARKET",
      status: "FILLED",
      size: 1000000,
      price: "1.00",
      currency: "ARS",
      datetime: new Date("2023-07-12T12:11:20Z"),
      idempotencyKey: null,
    } as OrderOrmEntity;

    const order = toDomain(entity);

    expect(order.size).toBe(100000000);
    expect(order.price).toBe(100);
  });

  it("maps a domain order back to an entity", () => {
    const entity = toOrm({
      instrumentId: 66,
      userId: 1,
      side: OrderSide.CASH_IN,
      type: OrderType.MARKET,
      status: OrderStatus.FILLED,
      size: 100000000,
      price: 100,
      currency: "ARS",
      datetime: new Date("2023-07-12T12:11:20Z"),
      idempotencyKey: "key-1",
    });

    expect(entity.size).toBe(1000000);
    expect(entity.price).toBe("1.00");
    expect(entity.idempotencyKey).toBe("key-1");
  });
});
