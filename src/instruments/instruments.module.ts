import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GetLatestQuoteUseCase } from "./application/use-cases/get-latest-quote.use-case";
import { SearchInstrumentsUseCase } from "./application/use-cases/search-instruments.use-case";
import { GET_LATEST_QUOTE } from "./domain/ports/in/get-latest-quote.port";
import { SEARCH_INSTRUMENTS } from "./domain/ports/in/search-instruments.port";
import { INSTRUMENT_REPOSITORY } from "./domain/ports/out/instrument-repository.port";
import { MARKET_DATA_REPOSITORY } from "./domain/ports/out/market-data-repository.port";
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
    { provide: GET_LATEST_QUOTE, useClass: GetLatestQuoteUseCase },
    { provide: INSTRUMENT_REPOSITORY, useClass: TypeOrmInstrumentRepository },
    { provide: MARKET_DATA_REPOSITORY, useClass: TypeOrmMarketDataRepository },
  ],
  exports: [GET_LATEST_QUOTE],
})
export class InstrumentsModule {}
