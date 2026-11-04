import { Controller, Get, Inject, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  SEARCH_INSTRUMENTS,
  type SearchInstruments,
} from "../../domain/ports/in/search-instruments.port";
import { InstrumentDto } from "./instrument.dto";
import { SearchInstrumentsQueryDto } from "./search-instruments.dto";

@ApiTags("instruments")
@Controller("instruments")
export class InstrumentsController {
  public constructor(
    @Inject(SEARCH_INSTRUMENTS)
    private readonly searchInstruments: SearchInstruments,
  ) {}

  @Get()
  @ApiOperation({ summary: "Search instruments by ticker or name" })
  @ApiOkResponse({ type: InstrumentDto, isArray: true })
  public async search(
    @Query() query: SearchInstrumentsQueryDto,
  ): Promise<InstrumentDto[]> {
    const instruments = await this.searchInstruments.execute(query.q);
    return instruments.map((instrument) =>
      InstrumentDto.fromDomain(instrument),
    );
  }
}
