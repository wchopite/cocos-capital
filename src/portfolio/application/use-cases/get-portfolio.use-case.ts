import { Inject, Injectable } from "@nestjs/common";
import { computePortfolio } from "../../domain/valuation";
import type { Portfolio } from "../../domain/models/portfolio";
import type { Quote } from "../../domain/models/quote";
import type { GetPortfolio } from "../../domain/ports/in/get-portfolio.port";
import {
  HOLDINGS_PROVIDER,
  type HoldingsProvider,
} from "../../domain/ports/out/holdings-provider.port";
import {
  QUOTE_PROVIDER,
  type QuoteProvider,
} from "../../domain/ports/out/quote-provider.port";

@Injectable()
export class GetPortfolioUseCase implements GetPortfolio {
  public constructor(
    @Inject(HOLDINGS_PROVIDER)
    private readonly holdingsProvider: HoldingsProvider,
    @Inject(QUOTE_PROVIDER)
    private readonly quoteProvider: QuoteProvider,
  ) {}

  public async execute(userId: number): Promise<Portfolio> {
    const holdings = await this.holdingsProvider.getHoldings(userId);

    const quotes = new Map<number, Quote>();
    for (const position of holdings.positions) {
      const quote = await this.quoteProvider.getLatestQuote(
        position.instrumentId,
      );
      quotes.set(position.instrumentId, quote);
    }

    return computePortfolio(holdings, quotes);
  }
}
