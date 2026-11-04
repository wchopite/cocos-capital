import type { Instrument } from "../../models/instrument";

export interface InstrumentRepository {
  search(query: string): Promise<Instrument[]>;
}

export const INSTRUMENT_REPOSITORY = Symbol("INSTRUMENT_REPOSITORY");
