import type { Instrument } from "../../domain/models/instrument";
import type { InstrumentRepository } from "../../domain/ports/out/instrument-repository.port";
import { SearchInstrumentsUseCase } from "./search-instruments.use-case";

describe("SearchInstrumentsUseCase", () => {
  it("delegates the query to the repository", async () => {
    const expected: Instrument[] = [
      { id: 1, ticker: "YPFD", name: "Y.P.F. S.A.", type: "ACCIONES" },
    ];
    const search = jest.fn().mockResolvedValue(expected);
    const repository: InstrumentRepository = { search };
    const useCase = new SearchInstrumentsUseCase(repository);

    const result = await useCase.execute("ypf");

    expect(search).toHaveBeenCalledWith("ypf");
    expect(result).toBe(expected);
  });
});
