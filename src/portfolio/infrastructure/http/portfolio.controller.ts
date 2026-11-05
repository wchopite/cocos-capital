import { Controller, Get, Headers, Inject } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  GET_PORTFOLIO,
  type GetPortfolio,
} from "../../domain/ports/in/get-portfolio.port";
import { PortfolioDto } from "./portfolio.dto";

@ApiTags("portfolio")
@Controller("portfolio")
export class PortfolioController {
  public constructor(
    @Inject(GET_PORTFOLIO)
    private readonly getPortfolio: GetPortfolio,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get the user's portfolio" })
  @ApiOkResponse({ type: PortfolioDto })
  public async get(
    @Headers("X-User-Id") userId: string,
  ): Promise<PortfolioDto> {
    const portfolio = await this.getPortfolio.execute(Number(userId));
    return PortfolioDto.fromDomain(portfolio);
  }
}
