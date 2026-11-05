import { Inject, Injectable, Optional } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
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
    @Optional()
    @InjectPinoLogger(GetHoldingsUseCase.name)
    private readonly logger?: PinoLogger,
  ) {}

  public async execute(userId: number): Promise<Holdings> {
    const orders = await this.orderRepository.findFilledByUser(userId);
    const holdings = computeHoldings(orders);

    this.logger?.debug(
      { userId, positionCount: holdings.positions.length },
      "holdings computed",
    );

    return holdings;
  }
}
