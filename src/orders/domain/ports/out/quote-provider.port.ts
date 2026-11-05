import type { Quote } from "../../models/quote";

export interface QuoteProvider {
  getLatestQuote(instrumentId: number): Promise<Quote>;
}

export const QUOTE_PROVIDER = Symbol("QUOTE_PROVIDER");
