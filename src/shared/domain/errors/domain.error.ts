export interface DomainErrorOptions {
  code: string;
  message: string;
  statusCode?: number;
  cause?: unknown;
}

export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  public constructor(options: DomainErrorOptions) {
    super(
      options.message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = new.target.name;
    this.code = options.code;
    this.statusCode = options.statusCode ?? 400;
  }
}
