import type { Currency } from "../../../../shared/domain/currency";
import type {
  Instrument,
  InstrumentType,
} from "../../../domain/models/instrument";
import type { InstrumentOrmEntity } from "../entities/instrument.orm-entity";

export function toDomain(entity: InstrumentOrmEntity): Instrument {
  return {
    id: entity.id,
    ticker: entity.ticker,
    name: entity.name,
    type: entity.type as InstrumentType,
    currency: entity.currency as Currency,
  };
}
