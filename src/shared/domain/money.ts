import type { Currency } from "./currency";

export const CENTS_PER_UNIT = 100;

const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

export function toCents(amount: number | string): number {
  const text = typeof amount === "number" ? amount.toString() : amount.trim();

  if (!DECIMAL_PATTERN.test(text)) {
    throw new TypeError(`Invalid monetary amount: ${amount}`);
  }

  const [whole = "0", fraction = ""] = text.split(".");
  const wholeUnits = Number.parseInt(whole, 10);
  const digits = fraction.padEnd(3, "0");

  let cents = Number.parseInt(digits.slice(0, 2), 10);
  if (Number.parseInt(digits[2], 10) >= 5) {
    cents += 1;
  }

  return wholeUnits * CENTS_PER_UNIT + cents;
}

export function fromCents(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new TypeError(
      `Expected a non-negative integer amount in cents, got: ${cents}`,
    );
  }

  const whole = Math.floor(cents / CENTS_PER_UNIT);
  const fraction = (cents % CENTS_PER_UNIT).toString().padStart(2, "0");

  return `${whole}.${fraction}`;
}

export interface Money {
  readonly amount: number;
  readonly currency: Currency;
}

export function money(amount: number, currency: Currency): Money {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new TypeError(
      `Expected a non-negative integer amount in cents, got: ${amount}`,
    );
  }

  return { amount, currency };
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount + b.amount, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);

  if (a.amount < b.amount) {
    throw new TypeError(
      `Cannot subtract ${b.amount} from ${a.amount}: money is non-negative`,
    );
  }

  return money(a.amount - b.amount, a.currency);
}

export function isZeroMoney(value: Money): boolean {
  return value.amount === 0;
}

export function formatMoney(value: Money): string {
  return `${fromCents(value.amount)} ${value.currency}`;
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new TypeError(
      `Cannot operate on different currencies: ${a.currency} vs ${b.currency}`,
    );
  }
}
