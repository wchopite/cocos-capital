import { ApiProperty } from "@nestjs/swagger";
import type { Currency } from "../../../shared/domain/currency";
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

  @ApiProperty({ enum: ["ARS", "USD"] })
  public currency: Currency;

  @ApiProperty({ example: 0.44 })
  public dailyReturn: number;

  public static fromDomain(position: PortfolioPosition): PortfolioPositionDto {
    const dto = new PortfolioPositionDto();
    dto.instrumentId = position.instrumentId;
    dto.quantity = position.quantity;
    dto.marketValue = fromCents(position.marketValue.amount);
    dto.currency = position.marketValue.currency;
    dto.dailyReturn = position.dailyReturn;
    return dto;
  }
}

export class PortfolioDto {
  @ApiProperty({ example: { ARS: "904784.00", USD: "0.00" } })
  public totalValue: Record<Currency, string>;

  @ApiProperty({ example: { ARS: "753000.00", USD: "0.00" } })
  public cash: Record<Currency, string>;

  @ApiProperty({ type: PortfolioPositionDto, isArray: true })
  public positions: PortfolioPositionDto[];

  public static fromDomain(portfolio: Portfolio): PortfolioDto {
    const dto = new PortfolioDto();
    dto.totalValue = formatByCurrency(portfolio.totalValue);
    dto.cash = formatByCurrency(portfolio.cash);
    dto.positions = portfolio.positions.map((position) =>
      PortfolioPositionDto.fromDomain(position),
    );
    return dto;
  }
}

function formatByCurrency(
  values: Record<Currency, number>,
): Record<Currency, string> {
  return {
    ARS: fromCents(values.ARS),
    USD: fromCents(values.USD),
  };
}
