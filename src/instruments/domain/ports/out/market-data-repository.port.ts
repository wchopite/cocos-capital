import type { Quote } from "../../models/quote";

export interface MarketDataRepository {
  findLatestQuote(instrumentId: number): Promise<Quote | null>;
}

export const MARKET_DATA_REPOSITORY = Symbol("MARKET_DATA_REPOSITORY");
