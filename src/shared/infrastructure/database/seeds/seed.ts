import { readFileSync } from "node:fs";
import type { DataSource } from "typeorm";
import { AppDataSource } from "../data-source";
import { splitInsertStatements } from "./split-insert-statements";

export async function runSeed(dataSource: DataSource): Promise<number> {
  const sql = readFileSync("sql/database.sql", "utf8");

  const inserts = splitInsertStatements(sql);

  await dataSource.query(
    "TRUNCATE marketdata, orders, instruments, users RESTART IDENTITY CASCADE",
  );

  for (const insert of inserts) {
    await dataSource.query(insert);
  }

  return inserts.length;
}

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const count = await runSeed(AppDataSource);
    console.log(`Seeded ${count} INSERT statements`);
  } finally {
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  void seed();
}
