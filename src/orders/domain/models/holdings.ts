export interface Position {
  readonly instrumentId: number;
  readonly quantity: number;
}

export interface Holdings {
  readonly availableCash: number;
  readonly positions: Position[];
}
