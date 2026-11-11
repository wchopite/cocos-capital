import { Inject, Injectable, Optional } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { InstrumentNotFoundError } from "../../domain/errors/instrument-not-found.error";
import type { Quote } from "../../domain/models/quote";
import type { GetLatestQuote } from "../../domain/ports/in/get-latest-quote.port";
import {
  INSTRUMENT_REPOSITORY,
  type InstrumentRepository,
} from "../../domain/ports/out/instrument-repository.port";
import {
  MARKET_DATA_REPOSITORY,
  type MarketDataRepository,
} from "../../domain/ports/out/market-data-repository.port";

@Injectable()
export class GetLatestQuoteUseCase implements GetLatestQuote {
  public constructor(
    @Inject(MARKET_DATA_REPOSITORY)
    private readonly marketDataRepository: MarketDataRepository,
    @Inject(INSTRUMENT_REPOSITORY)
    private readonly instrumentRepository: InstrumentRepository,
    @Optional()
    @InjectPinoLogger(GetLatestQuoteUseCase.name)
    private readonly logger?: PinoLogger,
  ) {}

  public async execute(instrumentId: number): Promise<Quote> {
    const instrument = await this.instrumentRepository.findById(instrumentId);

    if (instrument === null) {
      throw new InstrumentNotFoundError(instrumentId);
    }

    const marketData =
      await this.marketDataRepository.findLatestQuote(instrumentId);

    if (marketData === null) {
      throw new InstrumentNotFoundError(instrumentId);
    }

    this.logger?.debug(
      { instrumentId, asOf: marketData.asOf },
      "quote resolved",
    );

    return { ...marketData, currency: instrument.currency };
  }
}
