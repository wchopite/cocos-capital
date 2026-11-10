import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CachedGetLatestQuote } from "./application/use-cases/cached-get-latest-quote";
import { GetLatestQuoteUseCase } from "./application/use-cases/get-latest-quote.use-case";
import { SearchInstrumentsUseCase } from "./application/use-cases/search-instruments.use-case";
import { GET_LATEST_QUOTE } from "./domain/ports/in/get-latest-quote.port";
import { SEARCH_INSTRUMENTS } from "./domain/ports/in/search-instruments.port";
import { INSTRUMENT_REPOSITORY } from "./domain/ports/out/instrument-repository.port";
import { MARKET_DATA_REPOSITORY } from "./domain/ports/out/market-data-repository.port";
import {
  QUOTE_CACHE,
  type QuoteCache,
} from "./domain/ports/out/quote-cache.port";
import { RedisQuoteCache } from "./infrastructure/cache/redis-quote.cache";
import { InstrumentsController } from "./infrastructure/http/instruments.controller";
import { InstrumentOrmEntity } from "./infrastructure/persistence/entities/instrument.orm-entity";
import { MarketDataOrmEntity } from "./infrastructure/persistence/entities/market-data.orm-entity";
import { TypeOrmInstrumentRepository } from "./infrastructure/persistence/repositories/instrument.repository";
import { TypeOrmMarketDataRepository } from "./infrastructure/persistence/repositories/market-data.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([InstrumentOrmEntity, MarketDataOrmEntity]),
  ],
  controllers: [InstrumentsController],
  providers: [
    { provide: SEARCH_INSTRUMENTS, useClass: SearchInstrumentsUseCase },
    GetLatestQuoteUseCase,
    { provide: QUOTE_CACHE, useClass: RedisQuoteCache },
    {
      provide: GET_LATEST_QUOTE,
      useFactory: (inner: GetLatestQuoteUseCase, cache: QuoteCache) =>
        new CachedGetLatestQuote(inner, cache),
      inject: [GetLatestQuoteUseCase, QUOTE_CACHE],
    },
    { provide: INSTRUMENT_REPOSITORY, useClass: TypeOrmInstrumentRepository },
    { provide: MARKET_DATA_REPOSITORY, useClass: TypeOrmMarketDataRepository },
  ],
  exports: [GET_LATEST_QUOTE],
})
export class InstrumentsModule {}
