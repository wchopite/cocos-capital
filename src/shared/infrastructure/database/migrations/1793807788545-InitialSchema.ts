import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1793807788545 implements MigrationInterface {
  name = "InitialSchema1793807788545";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        accountNumber VARCHAR(20) NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE instruments (
        id SERIAL PRIMARY KEY,
        ticker VARCHAR(10) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(10) NOT NULL,
        CONSTRAINT chk_instruments_type CHECK (type IN ('ACCIONES', 'MONEDA'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        instrumentId INT NOT NULL,
        userId INT NOT NULL,
        size INT NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        type VARCHAR(10) NOT NULL,
        side VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL,
        datetime TIMESTAMP NOT NULL,
        CONSTRAINT fk_orders_instrument FOREIGN KEY (instrumentId) REFERENCES instruments(id),
        CONSTRAINT fk_orders_user FOREIGN KEY (userId) REFERENCES users(id),
        CONSTRAINT chk_orders_type CHECK (type IN ('MARKET', 'LIMIT')),
        CONSTRAINT chk_orders_side CHECK (side IN ('BUY', 'SELL', 'CASH_IN', 'CASH_OUT')),
        CONSTRAINT chk_orders_status CHECK (status IN ('NEW', 'FILLED', 'REJECTED', 'CANCELLED'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE marketdata (
        id SERIAL PRIMARY KEY,
        instrumentId INT NOT NULL,
        high NUMERIC(10, 2),
        low NUMERIC(10, 2),
        open NUMERIC(10, 2),
        close NUMERIC(10, 2) NOT NULL,
        previousClose NUMERIC(10, 2) NOT NULL,
        date DATE NOT NULL,
        CONSTRAINT fk_marketdata_instrument FOREIGN KEY (instrumentId) REFERENCES instruments(id)
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_orders_user ON orders (userId)`);
    await queryRunner.query(
      `CREATE INDEX idx_orders_status ON orders (status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_marketdata_instrument ON marketdata (instrumentId)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE marketdata`);
    await queryRunner.query(`DROP TABLE orders`);
    await queryRunner.query(`DROP TABLE instruments`);
    await queryRunner.query(`DROP TABLE users`);
  }
}
