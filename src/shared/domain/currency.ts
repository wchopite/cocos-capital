export const Currency = {
  ARS: "ARS",
  USD: "USD",
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];
