import { DomainError } from "./domain.error";

describe("DomainError", () => {
  it("captures code and message", () => {
    const error = new DomainError({ code: "INVALID", message: "bad input" });

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("INVALID");
    expect(error.message).toBe("bad input");
  });

  it("defaults statusCode to 400", () => {
    const error = new DomainError({ code: "X", message: "m" });

    expect(error.statusCode).toBe(400);
  });

  it("allows overriding statusCode", () => {
    const error = new DomainError({
      code: "NOT_FOUND",
      message: "nope",
      statusCode: 404,
    });

    expect(error.statusCode).toBe(404);
  });

  it("keeps the subclass name", () => {
    class NotFoundError extends DomainError {}
    const error = new NotFoundError({ code: "NOT_FOUND", message: "nope" });

    expect(error.name).toBe("NotFoundError");
  });
});
