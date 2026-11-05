import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { DomainError } from "../../domain/errors/domain.error";
import { ErrorResponseDto } from "./error-response.dto";
import { getRequestId } from "./get-request-id";

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  public constructor(
    @InjectPinoLogger(DomainExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  public catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.warn(
      {
        code: exception.code,
        statusCode: exception.statusCode,
        method: request.method,
        url: request.url,
      },
      exception.message,
    );

    response
      .status(exception.statusCode)
      .json(
        new ErrorResponseDto(
          exception.statusCode,
          exception.code,
          exception.message,
          getRequestId(request),
        ),
      );
  }
}
