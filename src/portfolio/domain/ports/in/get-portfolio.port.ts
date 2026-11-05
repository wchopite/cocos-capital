import type { Portfolio } from "../../models/portfolio";

export interface GetPortfolio {
  execute(userId: number): Promise<Portfolio>;
}

export const GET_PORTFOLIO = Symbol("GET_PORTFOLIO");
