import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { DomainError } from "../../domain/errors/domain.error";
import { ErrorResponseDto } from "./error-response.dto";
import { getRequestId } from "./get-request-id";

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  public catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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
