import type { MarketData } from "../../models/quote";

export interface MarketDataRepository {
  findLatestQuote(instrumentId: number): Promise<MarketData | null>;
}

export const MARKET_DATA_REPOSITORY = Symbol("MARKET_DATA_REPOSITORY");
