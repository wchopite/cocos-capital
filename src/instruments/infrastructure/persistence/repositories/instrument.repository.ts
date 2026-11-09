import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import type { Instrument } from "../../../domain/models/instrument";
import type { InstrumentRepository } from "../../../domain/ports/out/instrument-repository.port";
import { InstrumentOrmEntity } from "../entities/instrument.orm-entity";
import { toDomain } from "../mappers/instrument.mapper";

@Injectable()
export class TypeOrmInstrumentRepository implements InstrumentRepository {
  public constructor(
    @InjectRepository(InstrumentOrmEntity)
    private readonly repository: Repository<InstrumentOrmEntity>,
  ) {}

  public async search(query: string): Promise<Instrument[]> {
    const pattern = `%${query}%`;

    const entities = await this.repository.find({
      where: [{ ticker: ILike(pattern) }, { name: ILike(pattern) }],
    });

    return entities.map(toDomain);
  }

  public async findById(id: number): Promise<Instrument | null> {
    const entity = await this.repository.findOne({ where: { id } });

    return entity === null ? null : toDomain(entity);
  }
}
