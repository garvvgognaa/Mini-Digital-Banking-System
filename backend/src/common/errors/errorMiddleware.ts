import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "./AppError";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.errors.map((e) => e.message).join("; "),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  if (err && typeof err === "object" && "code" in err) {
    const e = err as { code?: string; errno?: number; sqlMessage?: string };
    if (e.code === "ECONNREFUSED" || e.code === "ENOTFOUND") {
      res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message:
            "Cannot reach MySQL. Start the database and verify DB_HOST and DB_PORT in backend/.env.",
        },
      });
      return;
    }
    if (e.code === "ER_ACCESS_DENIED_ERROR" || e.errno === 1045) {
      res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "MySQL rejected the credentials. Check DB_USER and DB_PASSWORD in backend/.env.",
        },
      });
      return;
    }
    if (e.code === "ER_BAD_DB_ERROR" || e.errno === 1049) {
      res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Database DB_NAME does not exist. Create it (see schema.sql) or fix DB_NAME in backend/.env.",
        },
      });
      return;
    }
  }

  console.error(err);

  const exposeDetails = process.env.NODE_ENV !== "production";
  const fallbackMessage = "An unexpected error occurred.";
  const message =
    exposeDetails && err instanceof Error
      ? err.message || fallbackMessage
      : fallbackMessage;

  const body: {
    error: { code: string; message: string; details?: string };
  } = {
    error: {
      code: "INTERNAL_ERROR",
      message,
    },
  };

  if (exposeDetails && err instanceof Error && err.stack) {
    body.error.details = err.stack.split("\n").slice(0, 4).join("\n");
  }

  res.status(500).json(body);
}
