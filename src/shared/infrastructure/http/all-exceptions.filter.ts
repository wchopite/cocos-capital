import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ErrorResponseDto } from "./error-response.dto";
import { getRequestId } from "./get-request-id";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = getRequestId(request);

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const { error, message } = this.readHttpException(exception);

      if (statusCode >= 500) {
        this.logger.error(exception.message, exception.stack);
      }

      response
        .status(statusCode)
        .json(new ErrorResponseDto(statusCode, error, message, requestId));
      return;
    }

    if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error("Non-Error value thrown", exception);
    }

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        new ErrorResponseDto(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Internal Server Error",
          "Internal server error",
          requestId,
        ),
      );
  }

  private readHttpException(exception: HttpException): {
    error: string;
    message: string | string[];
  } {
    const body = exception.getResponse();

    if (typeof body === "string") {
      return { error: exception.name, message: body };
    }

    if (typeof body === "object" && body !== null) {
      const record = body as Record<string, unknown>;
      const error =
        typeof record.error === "string" ? record.error : exception.name;
      const message = record.message;

      if (Array.isArray(message)) {
        return { error, message: message.map(String) };
      }

      if (typeof message === "string") {
        return { error, message };
      }

      return { error, message: exception.message };
    }

    return { error: exception.name, message: exception.message };
  }
}
