import { readFileSync } from "node:fs";
import { AppDataSource } from "../data-source";

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const sql = readFileSync("sql/database.sql", "utf8");

    const inserts = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.toUpperCase().startsWith("INSERT"));

    await AppDataSource.query(
      "TRUNCATE marketdata, orders, instruments, users RESTART IDENTITY CASCADE",
    );

    for (const insert of inserts) {
      await AppDataSource.query(insert);
    }

    console.log(`Seeded ${inserts.length} INSERT statements`);
  } finally {
    await AppDataSource.destroy();
  }
}

void seed();
