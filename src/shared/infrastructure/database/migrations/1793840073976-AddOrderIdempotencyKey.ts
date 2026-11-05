import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderIdempotencyKey1793840073976 implements MigrationInterface {
  name = "AddOrderIdempotencyKey1793840073976";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE orders ADD COLUMN idempotencyKey VARCHAR(255)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_orders_idempotency_key ON orders (idempotencyKey)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_orders_idempotency_key`);
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN idempotencyKey`);
  }
}
