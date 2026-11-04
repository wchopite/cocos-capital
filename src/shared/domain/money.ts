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
