import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstrumentCurrency1794600000000 implements MigrationInterface {
  name = "AddInstrumentCurrency1794600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE instruments ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'ARS'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE instruments DROP COLUMN currency`);
  }
}
