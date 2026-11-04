import { Logger, type ArgumentsHost } from "@nestjs/common";
import type { Response } from "express";
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

describe("exception filters", () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("maps a DomainError to its code and statusCode", () => {
    const { host, status, json } = mockContext({ id: "req-1" });

    new DomainExceptionFilter().catch(
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
  });

  it("falls back to the x-request-id header", () => {
    const { host, json } = mockContext({ header: "hdr-1" });

    new DomainExceptionFilter().catch(
      new DomainError({ code: "X", message: "m" }),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: "hdr-1" }),
    );
  });

  it("maps an unknown error to a 500 envelope", () => {
    const { host, status, json } = mockContext({ id: "req-2" });

    new AllExceptionsFilter().catch(new Error("boom"), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Internal server error",
      requestId: "req-2",
    });
  });
});
