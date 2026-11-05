import { Inject, Injectable } from "@nestjs/common";
import {
  GET_LATEST_QUOTE,
  type GetLatestQuote,
} from "../../../instruments/domain/ports/in/get-latest-quote.port";
import type { Quote } from "../../domain/models/quote";
import type { QuoteProvider } from "../../domain/ports/out/quote-provider.port";

@Injectable()
export class InstrumentsQuoteAdapter implements QuoteProvider {
  public constructor(
    @Inject(GET_LATEST_QUOTE)
    private readonly getLatestQuoteUseCase: GetLatestQuote,
  ) {}

  public async getLatestQuote(instrumentId: number): Promise<Quote> {
    const quote = await this.getLatestQuoteUseCase.execute(instrumentId);
    return {
      instrumentId: quote.instrumentId,
      price: quote.close,
      asOf: quote.asOf,
    };
  }
}
