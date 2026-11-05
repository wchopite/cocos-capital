import { existsSync } from "node:fs";
import { join } from "node:path";
import { DataSource } from "typeorm";
import { LowerCaseNamingStrategy } from "./lower-case-naming.strategy";
import { migrations } from "./migrations";

if (existsSync(".env")) {
  process.loadEnvFile();
}

const baseDir = __dirname;

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number.parseInt(process.env.DB_PORT ?? "5432", 10),
  username: process.env.DB_USERNAME ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  database: process.env.DB_DATABASE ?? "cocos_capital",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  entities: [join(baseDir, "../../../**/*.orm-entity.{ts,js}")],
  migrations,
  namingStrategy: new LowerCaseNamingStrategy(),
  synchronize: (process.env.DB_SYNCHRONIZE ?? "false") === "true",
});
