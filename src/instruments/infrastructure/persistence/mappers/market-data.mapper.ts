import type { Quote } from "../../../domain/models/quote";
import { toCents } from "../../../../shared/domain/money";
import type { MarketDataOrmEntity } from "../entities/market-data.orm-entity";

export function toQuote(entity: MarketDataOrmEntity): Quote {
  return {
    instrumentId: entity.instrumentId,
    close: toCents(entity.close),
    previousClose: toCents(entity.previousClose),
    asOf: entity.date,
  };
}
