import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import Redis from "ioredis";
import type { Quote } from "../../domain/models/quote";
import type { QuoteCache } from "../../domain/ports/out/quote-cache.port";

const QUOTE_KEY_PREFIX = "quote:";

@Injectable()
export class RedisQuoteCache implements QuoteCache, OnApplicationShutdown {
  private readonly client: Redis;

  public constructor() {
    this.client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    this.client.on("error", () => {
      // Redis is down; the cache degrades to pass-through (best-effort).
    });
  }

  public onApplicationShutdown(): void {
    this.client.disconnect();
  }

  public async get(instrumentId: number): Promise<Quote | null> {
    try {
      const raw = await this.client.get(`${QUOTE_KEY_PREFIX}${instrumentId}`);
      return raw === null ? null : (JSON.parse(raw) as Quote);
    } catch {
      return null;
    }
  }

  public async set(
    instrumentId: number,
    quote: Quote,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.client.set(
        `${QUOTE_KEY_PREFIX}${instrumentId}`,
        JSON.stringify(quote),
        "EX",
        ttlSeconds,
      );
    } catch {
      // best-effort: a cache failure must not break the request
    }
  }
}
