import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("marketdata")
export class MarketDataOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  instrumentId: number;

  @Column({ type: "numeric", nullable: true })
  high: string | null;

  @Column({ type: "numeric", nullable: true })
  low: string | null;

  @Column({ type: "numeric", nullable: true })
  open: string | null;

  @Column({ type: "numeric" })
  close: string;

  @Column({ type: "numeric" })
  previousClose: string;

  @Column({ type: "date" })
  date: string;
}
