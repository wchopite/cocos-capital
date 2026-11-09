import type { Currency } from "../../../../shared/domain/currency";
import {
  CENTS_PER_UNIT,
  fromCents,
  toCents,
} from "../../../../shared/domain/money";
import {
  OrderSide,
  OrderStatus,
  OrderType,
  type Order,
} from "../../../domain/models/order";
import { OrderOrmEntity } from "../entities/order.orm-entity";

export function toDomain(entity: OrderOrmEntity): Order {
  const side = entity.side as OrderSide;

  return {
    id: entity.id,
    instrumentId: entity.instrumentId,
    userId: entity.userId,
    side,
    type: entity.type as OrderType,
    status: entity.status as OrderStatus,
    size: toSize(side, entity.size),
    price: toCents(entity.price),
    currency: entity.currency as Currency,
    datetime: entity.datetime,
    idempotencyKey: entity.idempotencyKey ?? undefined,
  };
}

export function toOrm(order: Order): OrderOrmEntity {
  const entity = new OrderOrmEntity();
  entity.instrumentId = order.instrumentId;
  entity.userId = order.userId;
  entity.side = order.side;
  entity.type = order.type;
  entity.status = order.status;
  entity.size = fromSize(order.side, order.size);
  entity.price = fromCents(order.price);
  entity.currency = order.currency;
  entity.datetime = order.datetime;
  entity.idempotencyKey = order.idempotencyKey ?? null;
  return entity;
}

function toSize(side: OrderSide, size: number): number {
  return isCash(side) ? size * CENTS_PER_UNIT : size;
}

function fromSize(side: OrderSide, size: number): number {
  return isCash(side) ? size / CENTS_PER_UNIT : size;
}

function isCash(side: OrderSide): boolean {
  return side === OrderSide.CASH_IN || side === OrderSide.CASH_OUT;
}
