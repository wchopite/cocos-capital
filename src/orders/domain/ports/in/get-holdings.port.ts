import type { Holdings } from "../../models/holdings";

export interface GetHoldings {
  execute(userId: number): Promise<Holdings>;
}

export const GET_HOLDINGS = Symbol("GET_HOLDINGS");
