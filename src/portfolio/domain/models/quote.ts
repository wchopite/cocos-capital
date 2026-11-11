import type { Currency } from "../../../shared/domain/currency";

export interface Quote {
  readonly instrumentId: number;
  readonly close: number;
  readonly previousClose: number;
  readonly currency: Currency;
}
