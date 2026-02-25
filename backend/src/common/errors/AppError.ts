export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INSUFFICIENT_FUNDS"
  | "ACCOUNT_INACTIVE"
  | "INTERNAL_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "DUPLICATE_EMAIL"
  | "INVALID_CREDENTIALS"
  | "DESTINATION_NOT_FOUND"
  | "USER_INACTIVE";

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly isOperational: boolean;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    options?: { cause?: unknown; isOperational?: boolean }
  ) {
    super(message);
    this.name = "AppError";
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
    this.status = status;
    this.code = code;
    this.isOperational = options?.isOperational ?? true;
  }
}
