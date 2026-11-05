import type { Holdings } from "./models/holdings";
import type { Portfolio, PortfolioPosition } from "./models/portfolio";
import type { Quote } from "./models/quote";

export function computePortfolio(
  holdings: Holdings,
  quotes: Map<number, Quote>,
): Portfolio {
  let marketValueTotal = 0;
  const positions: PortfolioPosition[] = [];

  for (const position of holdings.positions) {
    if (position.quantity <= 0) {
      continue;
    }

    const quote = quotes.get(position.instrumentId);
    if (quote === undefined) {
      continue;
    }

    const marketValue = position.quantity * quote.close;
    marketValueTotal += marketValue;

    positions.push({
      instrumentId: position.instrumentId,
      quantity: position.quantity,
      marketValue,
      dailyReturn: computeDailyReturn(quote.close, quote.previousClose),
    });
  }

  return {
    totalValue: holdings.availableCash + marketValueTotal,
    availableCash: holdings.availableCash,
    positions,
  };
}

export function computeDailyReturn(
  close: number,
  previousClose: number,
): number {
  if (previousClose === 0) {
    return 0;
  }

  const raw = ((close - previousClose) / previousClose) * 100;
  return Math.round(raw * 100) / 100;
}
