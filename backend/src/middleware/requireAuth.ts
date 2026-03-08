import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../common/errors/AppError";
import type { JwtService } from "../auth/JwtService";

export function createRequireAuth(jwtService: JwtService): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) {
        next(new AppError(401, "UNAUTHORIZED", "Missing or invalid Authorization header."));
        return;
      }
      const token = header.slice("Bearer ".length).trim();
      if (!token) {
        next(new AppError(401, "UNAUTHORIZED", "Missing bearer token."));
        return;
      }
      const payload = jwtService.verify(token);
      req.auth = { id: payload.sub, email: payload.email };
      next();
    } catch (err) {
      if (err instanceof AppError) {
        next(err);
        return;
      }
      if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
        next(new AppError(401, "UNAUTHORIZED", "Invalid or expired token."));
        return;
      }
      next(err);
    }
  };
}
