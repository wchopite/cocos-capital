import { InstrumentNotFoundError } from "../../domain/errors/instrument-not-found.error";
import type { MarketData } from "../../domain/models/quote";
import type { InstrumentRepository } from "../../domain/ports/out/instrument-repository.port";
import type { MarketDataRepository } from "../../domain/ports/out/market-data-repository.port";
import { GetLatestQuoteUseCase } from "./get-latest-quote.use-case";

function makeInstrumentRepository(findById: jest.Mock): InstrumentRepository {
  return { search: jest.fn(), findById };
}

describe("GetLatestQuoteUseCase", () => {
  it("returns the latest quote with the instrument currency", async () => {
    const marketData: MarketData = {
      instrumentId: 47,
      close: 34150,
      previousClose: 33500,
      asOf: "2023-07-14",
    };
    const findLatestQuote = jest.fn().mockResolvedValue(marketData);
    const marketDataRepository: MarketDataRepository = { findLatestQuote };

    const findById = jest.fn().mockResolvedValue({
      id: 47,
      ticker: "PGR",
      name: "Phoenix",
      type: "ACCIONES",
      currency: "ARS",
    });

    const useCase = new GetLatestQuoteUseCase(
      marketDataRepository,
      makeInstrumentRepository(findById),
    );

    const result = await useCase.execute(47);

    expect(findLatestQuote).toHaveBeenCalledWith(47);
    expect(result).toEqual({
      instrumentId: 47,
      close: 34150,
      previousClose: 33500,
      asOf: "2023-07-14",
      currency: "ARS",
    });
  });

  it("throws when the instrument does not exist", async () => {
    const findLatestQuote = jest.fn();
    const marketDataRepository: MarketDataRepository = { findLatestQuote };
    const findById = jest.fn().mockResolvedValue(null);

    const useCase = new GetLatestQuoteUseCase(
      marketDataRepository,
      makeInstrumentRepository(findById),
    );

    await expect(useCase.execute(999)).rejects.toThrow(InstrumentNotFoundError);
  });

  it("throws when there is no quote", async () => {
    const findLatestQuote = jest.fn().mockResolvedValue(null);
    const marketDataRepository: MarketDataRepository = { findLatestQuote };
    const findById = jest.fn().mockResolvedValue({
      id: 47,
      ticker: "PGR",
      name: "Phoenix",
      type: "ACCIONES",
      currency: "ARS",
    });

    const useCase = new GetLatestQuoteUseCase(
      marketDataRepository,
      makeInstrumentRepository(findById),
    );

    await expect(useCase.execute(47)).rejects.toThrow(InstrumentNotFoundError);
  });
});
