import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("orders")
export class OrderOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  instrumentId: number;

  @Column()
  userId: number;

  @Column()
  size: number;

  @Column({ type: "numeric" })
  price: string;

  @Column()
  currency: string;

  @Column()
  type: string;

  @Column()
  side: string;

  @Column()
  status: string;

  @Column({ type: "timestamp" })
  datetime: Date;

  @Column({ type: "varchar", nullable: true })
  idempotencyKey: string | null;
}
