import type { Holdings } from "../../domain/models/holdings";
import type { Quote } from "../../domain/models/quote";
import type { HoldingsProvider } from "../../domain/ports/out/holdings-provider.port";
import type { QuoteProvider } from "../../domain/ports/out/quote-provider.port";
import { GetPortfolioUseCase } from "./get-portfolio.use-case";

describe("GetPortfolioUseCase", () => {
  it("composes holdings with quotes into a portfolio", async () => {
    const holdings: Holdings = {
      availableCash: 100000,
      positions: [{ instrumentId: 47, quantity: 40 }],
    };

    const getHoldings = jest.fn().mockResolvedValue(holdings);
    const getLatestQuote = jest.fn().mockResolvedValue({
      instrumentId: 47,
      close: 92585,
      previousClose: 92180,
    } satisfies Quote);

    const holdingsProvider: HoldingsProvider = { getHoldings };
    const quoteProvider: QuoteProvider = { getLatestQuote };

    const useCase = new GetPortfolioUseCase(holdingsProvider, quoteProvider);

    const portfolio = await useCase.execute(1);

    expect(getHoldings).toHaveBeenCalledWith(1);
    expect(getLatestQuote).toHaveBeenCalledWith(47);
    expect(portfolio.totalValue).toBe(3803400);
    expect(portfolio.positions).toEqual([
      {
        instrumentId: 47,
        quantity: 40,
        marketValue: 3703400,
        dailyReturn: 0.44,
      },
    ]);
  });
});
