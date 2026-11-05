export interface PortfolioPosition {
  readonly instrumentId: number;
  readonly quantity: number;
  readonly marketValue: number;
  readonly dailyReturn: number;
}

export interface Portfolio {
  readonly totalValue: number;
  readonly availableCash: number;
  readonly positions: PortfolioPosition[];
}
