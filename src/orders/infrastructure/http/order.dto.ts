import { ApiProperty } from "@nestjs/swagger";
import { fromCents } from "../../../shared/domain/money";
import {
  OrderSide,
  OrderStatus,
  OrderType,
  type Order,
} from "../../domain/models/order";

export class OrderDto {
  @ApiProperty()
  public id: number;

  @ApiProperty()
  public instrumentId: number;

  @ApiProperty()
  public userId: number;

  @ApiProperty({ enum: Object.values(OrderSide) })
  public side: OrderSide;

  @ApiProperty({ enum: Object.values(OrderType) })
  public type: OrderType;

  @ApiProperty({ enum: Object.values(OrderStatus) })
  public status: OrderStatus;

  @ApiProperty()
  public size: number;

  @ApiProperty({ example: "930.00" })
  public price: string;

  @ApiProperty()
  public datetime: string;

  public static fromDomain(order: Order): OrderDto {
    const dto = new OrderDto();
    dto.id = order.id!;
    dto.instrumentId = order.instrumentId;
    dto.userId = order.userId;
    dto.side = order.side;
    dto.type = order.type;
    dto.status = order.status;
    dto.size = order.size;
    dto.price = fromCents(order.price);
    dto.datetime = order.datetime.toISOString();
    return dto;
  }
}
