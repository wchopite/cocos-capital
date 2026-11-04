import type { Request } from "express";

export function getRequestId(request: Request): string {
  const id = request.id;

  if (typeof id === "string") {
    return id;
  }

  if (typeof id === "number") {
    return String(id);
  }

  const header = request.headers["x-request-id"];
  const headerValue = Array.isArray(header) ? header[0] : header;

  return headerValue ?? "unknown";
}
