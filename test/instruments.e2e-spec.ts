import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { AppModule } from "./../src/app.module";
import { startTestDatabase } from "./utils/test-database";

describe("Instruments (e2e)", () => {
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

  it("searches instruments by ticker", async () => {
    const response = await request(app.getHttpServer())
      .get("/instruments")
      .query({ q: "ypf" })
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ ticker: "YPFD" })]),
    );
  });

  it("searches instruments by name", async () => {
    const response = await request(app.getHttpServer())
      .get("/instruments")
      .query({ q: "banco" })
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Banco Frances" }),
      ]),
    );
  });
});
