import { MarketDataOrmEntity } from "../entities/market-data.orm-entity";
import { toQuote } from "./market-data.mapper";

describe("market-data.mapper", () => {
  it("maps an entity to a Quote with cents", () => {
    const entity: MarketDataOrmEntity = {
      id: 1,
      instrumentId: 35,
      high: "342.50",
      low: "328.50",
      open: "337.50",
      close: "341.50",
      previousClose: "335.00",
      date: "2023-07-13",
    };

    expect(toQuote(entity)).toEqual({
      instrumentId: 35,
      close: 34150,
      previousClose: 33500,
      asOf: "2023-07-13",
    });
  });
});
