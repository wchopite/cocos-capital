import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsNumber, Min, ValidateIf } from "class-validator";
import {
  OrderSide,
  OrderType,
  type TradeSide,
} from "../../domain/models/order";

export class PlaceOrderDto {
  @ApiProperty({ example: 47 })
  @IsInt()
  @Min(1)
  instrumentId: number;

  @ApiProperty({ enum: [OrderSide.BUY, OrderSide.SELL] })
  @IsIn([OrderSide.BUY, OrderSide.SELL])
  side: TradeSide;

  @ApiProperty({ enum: [OrderType.MARKET, OrderType.LIMIT] })
  @IsIn([OrderType.MARKET, OrderType.LIMIT])
  type: OrderType;

  @ApiProperty({ required: false, example: 10 })
  @ValidateIf((o: PlaceOrderDto) => o.amount === undefined)
  @IsInt()
  @Min(1)
  size?: number;

  @ApiProperty({ required: false, example: 10000 })
  @ValidateIf((o: PlaceOrderDto) => o.size === undefined)
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ required: false, example: 930 })
  @ValidateIf((o: PlaceOrderDto) => o.type === OrderType.LIMIT)
  @IsNumber()
  @Min(0)
  price?: number;
}
