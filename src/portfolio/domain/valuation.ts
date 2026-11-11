import type { Currency } from "../../shared/domain/currency";
import { money } from "../../shared/domain/money";
import type { Holdings } from "./models/holdings";
import type { Portfolio, PortfolioPosition } from "./models/portfolio";
import type { Quote } from "./models/quote";

export function computePortfolio(
  holdings: Holdings,
  quotes: Map<number, Quote>,
): Portfolio {
  const marketValueByCurrency: Record<Currency, number> = { ARS: 0, USD: 0 };
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
    marketValueByCurrency[quote.currency] += marketValue;

    positions.push({
      instrumentId: position.instrumentId,
      quantity: position.quantity,
      marketValue: money(marketValue, quote.currency),
      dailyReturn: computeDailyReturn(quote.close, quote.previousClose),
    });
  }

  const totalValue: Record<Currency, number> = {
    ARS: holdings.cash.ARS + marketValueByCurrency.ARS,
    USD: holdings.cash.USD + marketValueByCurrency.USD,
  };

  return {
    totalValue,
    cash: holdings.cash,
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
