import { CENTS_PER_UNIT, fromCents, toCents } from "./money";

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
