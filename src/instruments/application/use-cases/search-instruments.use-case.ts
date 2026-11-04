import { Inject, Injectable } from "@nestjs/common";
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
  ) {}

  public execute(query: string): Promise<Instrument[]> {
    return this.instrumentRepository.search(query);
  }
}
