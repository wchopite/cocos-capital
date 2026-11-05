import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { OrderStatus, type Order } from "../../../domain/models/order";
import type {
  OrderRepository,
  UserLockContext,
} from "../../../domain/ports/out/order-repository.port";
import { OrderOrmEntity } from "../entities/order.orm-entity";
import { toDomain, toOrm } from "../mappers/order.mapper";

@Injectable()
export class TypeOrmOrderRepository implements OrderRepository {
  public constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly repository: Repository<OrderOrmEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  public async save(order: Order): Promise<Order> {
    const entity = await this.repository.save(toOrm(order));
    return toDomain(entity);
  }

  public async findById(id: number): Promise<Order | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity === null ? null : toDomain(entity);
  }

  public async findFilledByUser(userId: number): Promise<Order[]> {
    const entities = await this.repository.find({
      where: { userId, status: OrderStatus.FILLED },
    });
    return entities.map(toDomain);
  }

  public async findByIdempotencyKey(key: string): Promise<Order | null> {
    const entity = await this.repository.findOne({
      where: { idempotencyKey: key },
    });
    return entity === null ? null : toDomain(entity);
  }

  public async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    await this.repository.update(id, { status });
    const entity = await this.repository.findOneOrFail({ where: { id } });
    return toDomain(entity);
  }

  public withUserLock<T>(
    userId: number,
    work: (ctx: UserLockContext) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [
        userId,
      ]);

      const filledEntities = await manager.find(OrderOrmEntity, {
        where: { userId, status: OrderStatus.FILLED },
      });

      const ctx: UserLockContext = {
        filledOrders: filledEntities.map(toDomain),
        save: async (order) => {
          const saved = await manager.save(toOrm(order));
          return toDomain(saved);
        },
      };

      return work(ctx);
    });
  }
}
