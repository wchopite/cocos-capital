import type { Quote } from "../../domain/models/quote";
import type { GetLatestQuote } from "../../domain/ports/in/get-latest-quote.port";
import type { QuoteCache } from "../../domain/ports/out/quote-cache.port";

const QUOTE_CACHE_TTL_SECONDS = 30;

export class CachedGetLatestQuote implements GetLatestQuote {
  public constructor(
    private readonly inner: GetLatestQuote,
    private readonly cache: QuoteCache,
  ) {}

  public async execute(instrumentId: number): Promise<Quote> {
    const cached = await this.tryGet(instrumentId);

    if (cached !== null) {
      return cached;
    }

    const quote = await this.inner.execute(instrumentId);
    await this.trySet(instrumentId, quote);

    return quote;
  }

  private async tryGet(instrumentId: number): Promise<Quote | null> {
    try {
      return await this.cache.get(instrumentId);
    } catch {
      return null;
    }
  }

  private async trySet(instrumentId: number, quote: Quote): Promise<void> {
    try {
      await this.cache.set(instrumentId, quote, QUOTE_CACHE_TTL_SECONDS);
    } catch {
      // best-effort: a cache failure must not break the request
    }
  }
}
