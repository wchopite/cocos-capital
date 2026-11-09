import type { Currency } from "../../../shared/domain/currency";

export interface MarketData {
  readonly instrumentId: number;
  readonly close: number;
  readonly previousClose: number;
  readonly asOf: string;
}

export interface Quote extends MarketData {
  readonly currency: Currency;
}
