import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("instruments")
export class InstrumentOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ticker: string;

  @Column()
  name: string;

  @Column()
  type: string;
}
