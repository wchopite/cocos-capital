import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { AppModule } from "./../src/app.module";
import { startTestDatabase } from "./utils/test-database";

interface OrderBody {
  id: number;
  status: string;
}

describe("Orders (e2e)", () => {
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

  it("fills a MARKET BUY", async () => {
    const res = await request(app.getHttpServer())
      .post("/orders")
      .set("X-User-Id", "1")
      .send({ instrumentId: 47, side: "BUY", type: "MARKET", size: 10 })
      .expect(201);

    const body = res.body as OrderBody;
    expect(body.status).toBe("FILLED");
  });

  it("places a LIMIT BUY as NEW", async () => {
    const res = await request(app.getHttpServer())
      .post("/orders")
      .set("X-User-Id", "1")
      .send({
        instrumentId: 47,
        side: "BUY",
        type: "LIMIT",
        size: 10,
        price: 900,
      })
      .expect(201);

    const body = res.body as OrderBody;
    expect(body.status).toBe("NEW");
  });

  it("rejects a BUY without enough funds", async () => {
    const res = await request(app.getHttpServer())
      .post("/orders")
      .set("X-User-Id", "1")
      .send({ instrumentId: 47, side: "BUY", type: "MARKET", size: 100000 })
      .expect(201);

    const body = res.body as OrderBody;
    expect(body.status).toBe("REJECTED");
  });

  it("rejects a SELL without enough shares", async () => {
    const res = await request(app.getHttpServer())
      .post("/orders")
      .set("X-User-Id", "1")
      .send({ instrumentId: 47, side: "SELL", type: "MARKET", size: 100000 })
      .expect(201);

    const body = res.body as OrderBody;
    expect(body.status).toBe("REJECTED");
  });

  it("cancels a NEW order", async () => {
    const placed = await request(app.getHttpServer())
      .post("/orders")
      .set("X-User-Id", "1")
      .send({
        instrumentId: 47,
        side: "BUY",
        type: "LIMIT",
        size: 10,
        price: 900,
      })
      .expect(201);

    const placedBody = placed.body as OrderBody;
    expect(placedBody.status).toBe("NEW");

    const cancelled = await request(app.getHttpServer())
      .delete(`/orders/${placedBody.id}`)
      .set("X-User-Id", "1")
      .expect(200);

    const cancelledBody = cancelled.body as OrderBody;
    expect(cancelledBody.status).toBe("CANCELLED");
  });

  it("returns the same order for a repeated idempotency key", async () => {
    const body = { instrumentId: 47, side: "BUY", type: "MARKET", size: 5 };
    const key = "e2e-idempotency-1";

    const first = await request(app.getHttpServer())
      .post("/orders")
      .set("X-User-Id", "1")
      .set("Idempotency-Key", key)
      .send(body)
      .expect(201);

    const second = await request(app.getHttpServer())
      .post("/orders")
      .set("X-User-Id", "1")
      .set("Idempotency-Key", key)
      .send(body)
      .expect(201);

    const firstBody = first.body as OrderBody;
    const secondBody = second.body as OrderBody;
    expect(secondBody.id).toBe(firstBody.id);
  });

  it("serializes concurrent orders from the same user", async () => {
    const sendOrder = (size: number) =>
      request(app.getHttpServer())
        .post("/orders")
        .set("X-User-Id", "1")
        .send({ instrumentId: 47, side: "BUY", type: "MARKET", size });

    const [res1, res2] = await Promise.all([sendOrder(500), sendOrder(500)]);

    const statuses = [
      (res1.body as OrderBody).status,
      (res2.body as OrderBody).status,
    ].sort();

    expect(statuses).toEqual(["FILLED", "REJECTED"]);
  });
});
