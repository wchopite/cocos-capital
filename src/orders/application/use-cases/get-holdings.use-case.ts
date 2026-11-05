import { Inject, Injectable } from "@nestjs/common";
import { computeHoldings } from "../../domain/ledger";
import type { Holdings } from "../../domain/models/holdings";
import type { GetHoldings } from "../../domain/ports/in/get-holdings.port";
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from "../../domain/ports/out/order-repository.port";

@Injectable()
export class GetHoldingsUseCase implements GetHoldings {
  public constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  public async execute(userId: number): Promise<Holdings> {
    const orders = await this.orderRepository.findFilledByUser(userId);
    return computeHoldings(orders);
  }
}
