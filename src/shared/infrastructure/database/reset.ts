import { AppDataSource } from "./data-source";
import { runSeed } from "./seeds/seed";

export interface ResetResult {
  migrations: number;
  inserted: number;
}

export async function resetDatabase(): Promise<ResetResult> {
  await AppDataSource.initialize();

  try {
    await AppDataSource.query(
      "DROP TABLE IF EXISTS migrations, marketdata, orders, instruments, users CASCADE",
    );

    const applied = await AppDataSource.runMigrations();
    const inserted = await runSeed(AppDataSource);

    return { migrations: applied.length, inserted };
  } finally {
    await AppDataSource.destroy();
  }
}

async function reset(): Promise<void> {
  const { migrations, inserted } = await resetDatabase();
  console.log(
    `Database recreated: ${migrations} migrations applied, ${inserted} INSERT statements seeded`,
  );
}

if (require.main === module) {
  void reset();
}
