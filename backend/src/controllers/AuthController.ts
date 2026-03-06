import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../common/errors/AppError";
import type { AuthService } from "../services/AuthService";
import { loginBodySchema, registerBodySchema } from "../validators/authSchemas";

export class AuthController {
  constructor(private readonly auth: AuthService) { }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = registerBodySchema.parse(req.body);
      const result = await this.auth.register(body);
      res.status(201).json(result);
    } catch (err) {
      this.forward(err, next);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = loginBodySchema.parse(req.body);
      const result = await this.auth.login(body);
      res.status(200).json(result);
    } catch (err) {
      this.forward(err, next);
    }
  };

  private forward(err: unknown, next: NextFunction): void {
    if (err instanceof ZodError) {
      next(new AppError(400, "VALIDATION_ERROR", err.errors.map((e) => e.message).join("; ")));
      return;
    }
    next(err);
  }
}
