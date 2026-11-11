import type { Quote } from "../../models/quote";

export interface QuoteCache {
  get(instrumentId: number): Promise<Quote | null>;
  set(instrumentId: number, quote: Quote, ttlSeconds: number): Promise<void>;
}

export const QUOTE_CACHE = Symbol("QUOTE_CACHE");
