import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { DataSource } from "typeorm";
import { migrations } from "../../src/shared/infrastructure/database/migrations";
import { runSeed } from "../../src/shared/infrastructure/database/seeds/seed";

export async function startTestDatabase(): Promise<StartedPostgreSqlContainer> {
  const container = await new PostgreSqlContainer("postgres:17-alpine")
    .withUsername("postgres")
    .withPassword("postgres")
    .withDatabase("cocos_capital")
    .start();

  process.env.DB_HOST = container.getHost();
  process.env.DB_PORT = container.getPort().toString();
  process.env.DB_USERNAME = container.getUsername();
  process.env.DB_PASSWORD = container.getPassword();
  process.env.DB_DATABASE = container.getDatabase();
  process.env.DB_SSL = "false";

  const dataSource = new DataSource({
    type: "postgres",
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  });

  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();
  for (const Migration of migrations) {
    await new Migration().up(queryRunner);
  }
  await queryRunner.release();

  await runSeed(dataSource);

  await dataSource.destroy();

  return container;
}
