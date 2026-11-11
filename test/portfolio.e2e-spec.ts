import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { AppModule } from "./../src/app.module";
import { startTestDatabase } from "./utils/test-database";

interface OrderBody {
  status: string;
}

interface PortfolioBody {
  totalValue: { ARS: string; USD: string };
  cash: { ARS: string; USD: string };
  positions: Array<{
    instrumentId: number;
    quantity: number;
    marketValue: string;
    currency: string;
    dailyReturn: number;
  }>;
}

describe("Portfolio (e2e)", () => {
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

  it("values a USD position end-to-end", async () => {
    const getPortfolio = () =>
      request(app.getHttpServer())
        .get("/portfolio")
        .set("X-User-Id", "1")
        .expect(200);

    const before = (await getPortfolio()).body as PortfolioBody;
    expect(before.cash.USD).toBe("10000.00");
    expect(before.positions.filter((p) => p.currency === "USD")).toEqual([]);

    const order = await request(app.getHttpServer())
      .post("/orders")
      .set("X-User-Id", "1")
      .send({ instrumentId: 68, side: "BUY", type: "MARKET", size: 10 })
      .expect(201);

    expect((order.body as OrderBody).status).toBe("FILLED");

    const after = (await getPortfolio()).body as PortfolioBody;
    expect(after.cash.USD).toBe("8475.00");
    expect(after.totalValue.USD).toBe("10000.00");
    expect(after.positions).toContainEqual({
      instrumentId: 68,
      quantity: 10,
      marketValue: "1525.00",
      currency: "USD",
      dailyReturn: 1.67,
    });
  });
});
