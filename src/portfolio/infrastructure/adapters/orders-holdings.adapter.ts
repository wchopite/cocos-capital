import { Inject, Injectable } from "@nestjs/common";
import {
  GET_HOLDINGS,
  type GetHoldings,
} from "../../../orders/domain/ports/in/get-holdings.port";
import type { Holdings } from "../../domain/models/holdings";
import type { HoldingsProvider } from "../../domain/ports/out/holdings-provider.port";

@Injectable()
export class OrdersHoldingsAdapter implements HoldingsProvider {
  public constructor(
    @Inject(GET_HOLDINGS)
    private readonly getHoldingsUseCase: GetHoldings,
  ) {}

  public async getHoldings(userId: number): Promise<Holdings> {
    const holdings = await this.getHoldingsUseCase.execute(userId);

    return {
      cash: holdings.cash,
      positions: holdings.positions.map((position) => ({
        instrumentId: position.instrumentId,
        quantity: position.quantity,
      })),
    };
  }
}
