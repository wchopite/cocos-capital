import type { Quote } from "../../models/quote";

export interface GetLatestQuote {
  execute(instrumentId: number): Promise<Quote>;
}

export const GET_LATEST_QUOTE = Symbol("GET_LATEST_QUOTE");
