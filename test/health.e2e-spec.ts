import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { AppModule } from "./../src/app.module";
import { startTestDatabase } from "./utils/test-database";

describe("Health (e2e)", () => {
  let app: INestApplication<App>;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await startTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 120000);

  afterAll(async () => {
    await app?.close();
    await container?.stop();
  });

  it("/health (GET)", async () => {
    const response = await request(app.getHttpServer())
      .get("/health")
      .expect(200);

    expect(response.body).toEqual(expect.objectContaining({ status: "ok" }));
  });
});
