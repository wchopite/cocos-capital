import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderCurrency1794500000000 implements MigrationInterface {
  name = "AddOrderCurrency1794500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE orders ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'ARS'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN currency`);
  }
}
