import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { MarketData } from "../../../domain/models/quote";
import type { MarketDataRepository } from "../../../domain/ports/out/market-data-repository.port";
import { MarketDataOrmEntity } from "../entities/market-data.orm-entity";
import { toMarketData } from "../mappers/market-data.mapper";

@Injectable()
export class TypeOrmMarketDataRepository implements MarketDataRepository {
  public constructor(
    @InjectRepository(MarketDataOrmEntity)
    private readonly repository: Repository<MarketDataOrmEntity>,
  ) {}

  public async findLatestQuote(
    instrumentId: number,
  ): Promise<MarketData | null> {
    const entity = await this.repository.findOne({
      where: { instrumentId },
      order: { date: "DESC", id: "DESC" },
    });

    return entity === null ? null : toMarketData(entity);
  }
}
