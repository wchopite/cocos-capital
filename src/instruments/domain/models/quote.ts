export interface Quote {
  readonly instrumentId: number;
  readonly close: number;
  readonly previousClose: number;
  readonly asOf: string;
}
