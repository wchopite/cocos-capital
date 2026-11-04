export class ErrorResponseDto {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly message: string | string[];
  public readonly requestId: string;

  public constructor(
    statusCode: number,
    error: string,
    message: string | string[],
    requestId: string,
  ) {
    this.statusCode = statusCode;
    this.error = error;
    this.message = message;
    this.requestId = requestId;
  }
}
