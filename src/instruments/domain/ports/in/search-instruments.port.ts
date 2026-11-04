import type { Instrument } from "../../models/instrument";

export interface SearchInstruments {
  execute(query: string): Promise<Instrument[]>;
}

export const SEARCH_INSTRUMENTS = Symbol("SEARCH_INSTRUMENTS");
