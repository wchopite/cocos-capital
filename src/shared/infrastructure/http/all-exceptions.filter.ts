import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { ErrorResponseDto } from "./error-response.dto";
import { getRequestId } from "./get-request-id";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  public constructor(
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = getRequestId(request);

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const { error, message } = this.readHttpException(exception);

      if (statusCode >= 500) {
        this.logger.error(
          {
            statusCode,
            method: request.method,
            url: request.url,
            err: exception,
          },
          exception.message,
        );
      }

      response
        .status(statusCode)
        .json(new ErrorResponseDto(statusCode, error, message, requestId));
      return;
    }

    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof Error) {
      this.logger.error(
        {
          statusCode,
          method: request.method,
          url: request.url,
          err: exception,
        },
        exception.message,
      );
    } else {
      this.logger.error(
        {
          statusCode,
          method: request.method,
          url: request.url,
          value: exception,
        },
        "Non-Error value thrown",
      );
    }

    response
      .status(statusCode)
      .json(
        new ErrorResponseDto(
          statusCode,
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
