import type { ArgumentsHost } from "@nestjs/common";
import type { Response } from "express";
import type { PinoLogger } from "nestjs-pino";
import { DomainError } from "../../domain/errors/domain.error";
import { AllExceptionsFilter } from "./all-exceptions.filter";
import { DomainExceptionFilter } from "./domain-exception.filter";

interface MockedContext {
  host: ArgumentsHost;
  status: jest.Mock;
  json: jest.Mock;
}

function mockContext(
  options: { id?: string; header?: string } = {},
): MockedContext {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status } as unknown as Response;
  const request = {
    id: options.id,
    method: "GET",
    url: "/instruments?q=ypf",
    headers: options.header ? { "x-request-id": options.header } : {},
  } as unknown as Request;

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

interface LoggerMocks {
  logger: PinoLogger;
  error: jest.Mock;
  warn: jest.Mock;
}

function mockLogger(): LoggerMocks {
  const error = jest.fn();
  const warn = jest.fn();
  const info = jest.fn();
  const debug = jest.fn();
  const logger = { error, warn, info, debug } as unknown as PinoLogger;

  return { logger, error, warn };
}

describe("exception filters", () => {
  it("maps a DomainError to its code and statusCode", () => {
    const { host, status, json } = mockContext({ id: "req-1" });
    const { logger, warn } = mockLogger();

    new DomainExceptionFilter(logger).catch(
      new DomainError({
        code: "NOT_FOUND",
        message: "missing",
        statusCode: 404,
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      error: "NOT_FOUND",
      message: "missing",
      requestId: "req-1",
    });
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ code: "NOT_FOUND", statusCode: 404 }),
      "missing",
    );
  });

  it("falls back to the x-request-id header", () => {
    const { host, json } = mockContext({ header: "hdr-1" });
    const { logger } = mockLogger();

    new DomainExceptionFilter(logger).catch(
      new DomainError({ code: "X", message: "m" }),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: "hdr-1" }),
    );
  });

  it("maps an unknown error to a 500 envelope and logs it", () => {
    const { host, status, json } = mockContext({ id: "req-2" });
    const { logger, error } = mockLogger();

    new AllExceptionsFilter(logger).catch(new Error("boom"), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Internal server error",
      requestId: "req-2",
    });
    expect(error).toHaveBeenCalledTimes(1);
    const call = error.mock.calls[0] as [Record<string, unknown>, string];
    expect(call[1]).toBe("boom");
    expect(call[0]).toMatchObject({ statusCode: 500, method: "GET" });
    expect(call[0].err).toBeInstanceOf(Error);
  });
});
