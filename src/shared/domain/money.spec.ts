import { Currency } from "./currency";
import {
  CENTS_PER_UNIT,
  addMoney,
  formatMoney,
  fromCents,
  isZeroMoney,
  money,
  subtractMoney,
  toCents,
} from "./money";

describe("money", () => {
  describe("toCents", () => {
    it("converts whole amounts", () => {
      expect(toCents("10")).toBe(1000);
      expect(toCents("0")).toBe(0);
    });

    it("converts decimal amounts", () => {
      expect(toCents("19.99")).toBe(1999);
      expect(toCents("0.01")).toBe(1);
      expect(toCents("0.99")).toBe(99);
    });

    it("accepts numbers", () => {
      expect(toCents(19.99)).toBe(1999);
      expect(toCents(0.3)).toBe(30);
    });

    it("rounds half-up to two decimals", () => {
      expect(toCents("1.005")).toBe(101);
      expect(toCents("1.994")).toBe(199);
    });

    it("rejects invalid and negative input", () => {
      expect(() => toCents("abc")).toThrow();
      expect(() => toCents("")).toThrow();
      expect(() => toCents("-19.99")).toThrow();
    });
  });

  describe("fromCents", () => {
    it("formats integer cents as decimal string", () => {
      expect(fromCents(1999)).toBe("19.99");
      expect(fromCents(5)).toBe("0.05");
      expect(fromCents(0)).toBe("0.00");
    });

    it("rejects non-integer or negative cents", () => {
      expect(() => fromCents(19.99)).toThrow();
      expect(() => fromCents(-5)).toThrow();
    });
  });

  it("exposes the cents constant", () => {
    expect(CENTS_PER_UNIT).toBe(100);
  });
});

describe("Money", () => {
  it("creates a money value from cents and a currency", () => {
    expect(money(90000, Currency.ARS)).toEqual({
      amount: 90000,
      currency: "ARS",
    });
  });

  it("rejects negative or fractional amounts", () => {
    expect(() => money(-1, Currency.ARS)).toThrow(TypeError);
    expect(() => money(1.5, Currency.ARS)).toThrow(TypeError);
  });

  it("adds money of the same currency", () => {
    expect(addMoney(money(100, Currency.ARS), money(50, Currency.ARS))).toEqual(
      {
        amount: 150,
        currency: "ARS",
      },
    );
  });

  it("rejects adding money of different currencies", () => {
    expect(() =>
      addMoney(money(100, Currency.ARS), money(50, Currency.USD)),
    ).toThrow(TypeError);
  });

  it("subtracts money of the same currency", () => {
    expect(
      subtractMoney(money(100, Currency.ARS), money(30, Currency.ARS)),
    ).toEqual({ amount: 70, currency: "ARS" });
  });

  it("rejects subtracting more than available", () => {
    expect(() =>
      subtractMoney(money(100, Currency.ARS), money(150, Currency.ARS)),
    ).toThrow(TypeError);
  });

  it("knows when money is zero", () => {
    expect(isZeroMoney(money(0, Currency.ARS))).toBe(true);
    expect(isZeroMoney(money(5, Currency.ARS))).toBe(false);
  });

  it("formats money with its currency", () => {
    expect(formatMoney(money(90000, Currency.ARS))).toBe("900.00 ARS");
    expect(formatMoney(money(500, Currency.USD))).toBe("5.00 USD");
  });
});
