export type InstrumentType = "ACCIONES" | "MONEDA";

export interface Instrument {
  readonly id: number;
  readonly ticker: string;
  readonly name: string;
  readonly type: InstrumentType;
}
