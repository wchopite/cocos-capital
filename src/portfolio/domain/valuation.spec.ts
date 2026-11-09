import { computeDailyReturn, computePortfolio } from "./valuation";
import type { Holdings } from "./models/holdings";
import type { Quote } from "./models/quote";

describe("computePortfolio", () => {
  it("computes cash, market values and total value", () => {
    const holdings: Holdings = {
      cash: { ARS: 100000, USD: 0 },
      positions: [
        { instrumentId: 47, quantity: 40 },
        { instrumentId: 54, quantity: 500 },
      ],
    };

    const quotes = new Map<number, Quote>([
      [
        47,
        {
          instrumentId: 47,
          close: 92585,
          previousClose: 92180,
          currency: "ARS",
        },
      ],
      [
        54,
        {
          instrumentId: 54,
          close: 25000,
          previousClose: 26000,
          currency: "ARS",
        },
      ],
    ]);

    const portfolio = computePortfolio(holdings, quotes);

    expect(portfolio.availableCash).toBe(100000);
    expect(portfolio.positions).toEqual([
      {
        instrumentId: 47,
        quantity: 40,
        marketValue: 3703400,
        dailyReturn: 0.44,
      },
      {
        instrumentId: 54,
        quantity: 500,
        marketValue: 12500000,
        dailyReturn: -3.85,
      },
    ]);
    expect(portfolio.totalValue).toBe(16303400);
  });

  it("skips positions without a quote", () => {
    const holdings: Holdings = {
      cash: { ARS: 0, USD: 0 },
      positions: [{ instrumentId: 47, quantity: 40 }],
    };

    const portfolio = computePortfolio(holdings, new Map());

    expect(portfolio.positions).toEqual([]);
    expect(portfolio.totalValue).toBe(0);
  });

  it("skips non-positive positions", () => {
    const holdings: Holdings = {
      cash: { ARS: 100000, USD: 0 },
      positions: [
        { instrumentId: 31, quantity: -10 },
        { instrumentId: 47, quantity: 40 },
      ],
    };

    const quotes = new Map<number, Quote>([
      [
        31,
        {
          instrumentId: 31,
          close: 150280,
          previousClose: 152025,
          currency: "ARS",
        },
      ],
      [
        47,
        {
          instrumentId: 47,
          close: 92585,
          previousClose: 92180,
          currency: "ARS",
        },
      ],
    ]);

    const portfolio = computePortfolio(holdings, quotes);

    expect(portfolio.positions).toEqual([
      {
        instrumentId: 47,
        quantity: 40,
        marketValue: 3703400,
        dailyReturn: 0.44,
      },
    ]);
    expect(portfolio.totalValue).toBe(3803400);
  });
});

describe("computeDailyReturn", () => {
  it("computes the daily return percentage", () => {
    expect(computeDailyReturn(92585, 92180)).toBe(0.44);
    expect(computeDailyReturn(25000, 26000)).toBe(-3.85);
  });

  it("returns 0 when previousClose is 0", () => {
    expect(computeDailyReturn(100, 0)).toBe(0);
  });
});
