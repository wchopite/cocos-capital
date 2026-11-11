import type { Currency } from "../../../shared/domain/currency";
import type { Money } from "../../../shared/domain/money";

export interface PortfolioPosition {
  readonly instrumentId: number;
  readonly quantity: number;
  readonly marketValue: Money;
  readonly dailyReturn: number;
}

export interface Portfolio {
  readonly totalValue: Record<Currency, number>;
  readonly cash: Record<Currency, number>;
  readonly positions: PortfolioPosition[];
}
