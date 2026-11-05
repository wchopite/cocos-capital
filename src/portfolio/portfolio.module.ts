import { Module } from "@nestjs/common";
import { InstrumentsModule } from "../instruments/instruments.module";
import { OrdersModule } from "../orders/orders.module";
import { GetPortfolioUseCase } from "./application/use-cases/get-portfolio.use-case";
import { GET_PORTFOLIO } from "./domain/ports/in/get-portfolio.port";
import { HOLDINGS_PROVIDER } from "./domain/ports/out/holdings-provider.port";
import { QUOTE_PROVIDER } from "./domain/ports/out/quote-provider.port";
import { InstrumentsQuoteAdapter } from "./infrastructure/adapters/instruments-quote.adapter";
import { OrdersHoldingsAdapter } from "./infrastructure/adapters/orders-holdings.adapter";
import { PortfolioController } from "./infrastructure/http/portfolio.controller";

@Module({
  imports: [OrdersModule, InstrumentsModule],
  controllers: [PortfolioController],
  providers: [
    { provide: GET_PORTFOLIO, useClass: GetPortfolioUseCase },
    { provide: HOLDINGS_PROVIDER, useClass: OrdersHoldingsAdapter },
    { provide: QUOTE_PROVIDER, useClass: InstrumentsQuoteAdapter },
  ],
})
export class PortfolioModule {}
