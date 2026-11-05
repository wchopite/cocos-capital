import { ApiProperty } from "@nestjs/swagger";
import { fromCents } from "../../../shared/domain/money";
import type {
  Portfolio,
  PortfolioPosition,
} from "../../domain/models/portfolio";

export class PortfolioPositionDto {
  @ApiProperty()
  public instrumentId: number;

  @ApiProperty()
  public quantity: number;

  @ApiProperty({ example: "37034.00" })
  public marketValue: string;

  @ApiProperty({ example: 0.44 })
  public dailyReturn: number;

  public static fromDomain(position: PortfolioPosition): PortfolioPositionDto {
    const dto = new PortfolioPositionDto();
    dto.instrumentId = position.instrumentId;
    dto.quantity = position.quantity;
    dto.marketValue = fromCents(position.marketValue);
    dto.dailyReturn = position.dailyReturn;
    return dto;
  }
}

export class PortfolioDto {
  @ApiProperty({ example: "7530.00" })
  public totalValue: string;

  @ApiProperty({ example: "7530.00" })
  public availableCash: string;

  @ApiProperty({ type: PortfolioPositionDto, isArray: true })
  public positions: PortfolioPositionDto[];

  public static fromDomain(portfolio: Portfolio): PortfolioDto {
    const dto = new PortfolioDto();
    dto.totalValue = fromCents(portfolio.totalValue);
    dto.availableCash = fromCents(portfolio.availableCash);
    dto.positions = portfolio.positions.map((position) =>
      PortfolioPositionDto.fromDomain(position),
    );
    return dto;
  }
}
