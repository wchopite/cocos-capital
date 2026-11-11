import type { Currency } from "../../../shared/domain/currency";

export interface Quote {
  readonly instrumentId: number;
  readonly price: number;
  readonly asOf: string;
  readonly currency: Currency;
}
