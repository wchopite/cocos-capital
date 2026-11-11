import type { Quote } from "../../domain/models/quote";
import type { GetLatestQuote } from "../../domain/ports/in/get-latest-quote.port";
import type { QuoteCache } from "../../domain/ports/out/quote-cache.port";
import { CachedGetLatestQuote } from "./cached-get-latest-quote";

describe("CachedGetLatestQuote", () => {
  const quote: Quote = {
    instrumentId: 47,
    close: 34150,
    previousClose: 33500,
    asOf: "2023-07-14",
    currency: "ARS",
  };

  function createFakes(): {
    inner: GetLatestQuote;
    cache: QuoteCache;
    execute: jest.Mock;
    get: jest.Mock;
    set: jest.Mock;
  } {
    const execute = jest.fn().mockResolvedValue(quote);
    const get = jest.fn().mockResolvedValue(null);
    const set = jest.fn();

    return {
      inner: { execute },
      cache: { get, set },
      execute,
      get,
      set,
    };
  }

  it("returns the cached quote without calling the inner use case", async () => {
    const { inner, cache, execute, get, set } = createFakes();
    get.mockResolvedValue(quote);

    const useCase = new CachedGetLatestQuote(inner, cache, 30);

    const result = await useCase.execute(47);

    expect(result).toBe(quote);
    expect(get).toHaveBeenCalledWith(47);
    expect(execute).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });

  it("calls the inner use case on a miss and stores the result", async () => {
    const { inner, cache, execute, set } = createFakes();

    const useCase = new CachedGetLatestQuote(inner, cache, 30);

    const result = await useCase.execute(47);

    expect(result).toBe(quote);
    expect(execute).toHaveBeenCalledWith(47);
    expect(set).toHaveBeenCalledWith(47, quote, expect.any(Number));
  });

  it("stores the quote with the configured TTL", async () => {
    const { inner, cache, set } = createFakes();

    const useCase = new CachedGetLatestQuote(inner, cache, 120);

    await useCase.execute(47);

    expect(set).toHaveBeenCalledWith(47, quote, 120);
  });

  it("falls back to the inner use case when the cache fails", async () => {
    const { inner, cache, execute, get } = createFakes();
    get.mockRejectedValue(new Error("redis down"));

    const useCase = new CachedGetLatestQuote(inner, cache, 30);

    const result = await useCase.execute(47);

    expect(result).toBe(quote);
    expect(execute).toHaveBeenCalledWith(47);
  });
});
