import { Inject, Injectable, Optional } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import type { Instrument } from "../../domain/models/instrument";
import type { SearchInstruments } from "../../domain/ports/in/search-instruments.port";
import {
  INSTRUMENT_REPOSITORY,
  type InstrumentRepository,
} from "../../domain/ports/out/instrument-repository.port";

@Injectable()
export class SearchInstrumentsUseCase implements SearchInstruments {
  public constructor(
    @Inject(INSTRUMENT_REPOSITORY)
    private readonly instrumentRepository: InstrumentRepository,
    @Optional()
    @InjectPinoLogger(SearchInstrumentsUseCase.name)
    private readonly logger?: PinoLogger,
  ) {}

  public async execute(query: string): Promise<Instrument[]> {
    const instruments = await this.instrumentRepository.search(query);

    this.logger?.debug(
      { q: query, resultCount: instruments.length },
      "instruments searched",
    );

    return instruments;
  }
}
