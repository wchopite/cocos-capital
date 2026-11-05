import type { Holdings } from "../../models/holdings";

export interface HoldingsProvider {
  getHoldings(userId: number): Promise<Holdings>;
}

export const HOLDINGS_PROVIDER = Symbol("HOLDINGS_PROVIDER");
