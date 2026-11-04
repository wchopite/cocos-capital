import { InstrumentNotFoundError } from "../../domain/errors/instrument-not-found.error";
import type { Quote } from "../../domain/models/quote";
import type { MarketDataRepository } from "../../domain/ports/out/market-data-repository.port";
import { GetLatestQuoteUseCase } from "./get-latest-quote.use-case";

describe("GetLatestQuoteUseCase", () => {
  it("returns the latest quote", async () => {
    const quote: Quote = {
      instrumentId: 47,
      close: 34150,
      previousClose: 33500,
      asOf: "2023-07-14",
    };
    const findLatestQuote = jest.fn().mockResolvedValue(quote);
    const repository: MarketDataRepository = { findLatestQuote };
    const useCase = new GetLatestQuoteUseCase(repository);

    const result = await useCase.execute(47);

    expect(findLatestQuote).toHaveBeenCalledWith(47);
    expect(result).toBe(quote);
  });

  it("throws InstrumentNotFoundError when there is no quote", async () => {
    const findLatestQuote = jest.fn().mockResolvedValue(null);
    const repository: MarketDataRepository = { findLatestQuote };
    const useCase = new GetLatestQuoteUseCase(repository);

    await expect(useCase.execute(999)).rejects.toThrow(InstrumentNotFoundError);
  });
});
