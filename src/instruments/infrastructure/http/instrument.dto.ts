import { ApiProperty } from "@nestjs/swagger";
import type {
  Instrument,
  InstrumentType,
} from "../../domain/models/instrument";

export class InstrumentDto {
  @ApiProperty({ example: 35 })
  public id: number;

  @ApiProperty({ example: "PGR" })
  public ticker: string;

  @ApiProperty({ example: "Phoenix Global Resources" })
  public name: string;

  @ApiProperty({ enum: ["ACCIONES", "MONEDA"], example: "ACCIONES" })
  public type: InstrumentType;

  public static fromDomain(instrument: Instrument): InstrumentDto {
    const dto = new InstrumentDto();
    dto.id = instrument.id;
    dto.ticker = instrument.ticker;
    dto.name = instrument.name;
    dto.type = instrument.type;
    return dto;
  }
}
