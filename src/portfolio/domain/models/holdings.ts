import type { Currency } from "../../../shared/domain/currency";

export interface Position {
  readonly instrumentId: number;
  readonly quantity: number;
}

export interface Holdings {
  readonly cash: Record<Currency, number>;
  readonly positions: Position[];
}
