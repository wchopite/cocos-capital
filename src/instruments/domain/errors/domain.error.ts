import { DomainError } from "../../../shared/domain/errors/domain.error";

export class InstrumentNotFoundError extends DomainError {
  public constructor(instrumentId: number) {
    super({
      code: "INSTRUMENT_NOT_FOUND",
      message: `Instrument ${instrumentId} not found`,
      statusCode: 404,
    });
  }
}
