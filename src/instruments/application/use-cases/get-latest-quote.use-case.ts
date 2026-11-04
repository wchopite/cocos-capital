import { Inject, Injectable } from "@nestjs/common";
import { InstrumentNotFoundError } from "../../domain/errors/instrument-not-found.error";
import type { Quote } from "../../domain/models/quote";
import type { GetLatestQuote } from "../../domain/ports/in/get-latest-quote.port";
import {
  MARKET_DATA_REPOSITORY,
  type MarketDataRepository,
} from "../../domain/ports/out/market-data-repository.port";

@Injectable()
export class GetLatestQuoteUseCase implements GetLatestQuote {
  public constructor(
    @Inject(MARKET_DATA_REPOSITORY)
    private readonly marketDataRepository: MarketDataRepository,
  ) {}

  public async execute(instrumentId: number): Promise<Quote> {
    const quote = await this.marketDataRepository.findLatestQuote(instrumentId);

    if (quote === null) {
      throw new InstrumentNotFoundError(instrumentId);
    }

    return quote;
  }
}
