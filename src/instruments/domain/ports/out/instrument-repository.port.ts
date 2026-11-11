import type { Instrument } from "../../models/instrument";

export interface InstrumentRepository {
  search(query: string): Promise<Instrument[]>;
  findById(id: number): Promise<Instrument | null>;
}

export const INSTRUMENT_REPOSITORY = Symbol("INSTRUMENT_REPOSITORY");
