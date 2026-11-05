import {
  Body,
  Controller,
  Delete,
  Headers,
  Inject,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { toCents } from "../../../shared/domain/money";
import {
  CANCEL_ORDER,
  type CancelOrder,
} from "../../domain/ports/in/cancel-order.port";
import {
  PLACE_ORDER,
  type PlaceOrder,
  type PlaceOrderInput,
} from "../../domain/ports/in/place-order.port";
import { OrderDto } from "./order.dto";
import { PlaceOrderDto } from "./place-order.dto";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  public constructor(
    @Inject(PLACE_ORDER)
    private readonly placeOrder: PlaceOrder,
    @Inject(CANCEL_ORDER)
    private readonly cancelOrder: CancelOrder,
  ) {}

  @Post()
  @ApiOperation({ summary: "Send an order" })
  @ApiOkResponse({ type: OrderDto })
  public async create(
    @Headers("X-User-Id") userId: string,
    @Headers("Idempotency-Key") idempotencyKey: string | undefined,
    @Body() dto: PlaceOrderDto,
  ): Promise<OrderDto> {
    const input: PlaceOrderInput = {
      userId: Number(userId),
      instrumentId: dto.instrumentId,
      side: dto.side,
      type: dto.type,
      size: dto.size,
      amount: dto.amount !== undefined ? toCents(dto.amount) : undefined,
      price: dto.price !== undefined ? toCents(dto.price) : undefined,
      idempotencyKey,
    };

    const order = await this.placeOrder.execute(input);
    return OrderDto.fromDomain(order);
  }

  @Delete(":orderId")
  @ApiOperation({ summary: "Cancel a NEW order" })
  @ApiOkResponse({ type: OrderDto })
  public async cancel(
    @Headers("X-User-Id") userId: string,
    @Param("orderId", ParseIntPipe) orderId: number,
  ): Promise<OrderDto> {
    const order = await this.cancelOrder.execute(Number(userId), orderId);
    return OrderDto.fromDomain(order);
  }
}
