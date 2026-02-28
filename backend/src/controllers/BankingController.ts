import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../common/errors/AppError";
import type { BankingApiService } from "../services/BankingApiService";
import {
  depositBodySchema,
  transferBodySchema,
  withdrawBodySchema,
} from "../validators/bankingSchemas";

export class BankingController {
  constructor(private readonly banking: BankingApiService) { }

  deposit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.id;
      if (!userId) {
        next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
        return;
      }
      const body = depositBodySchema.parse(req.body);
      const result = await this.banking.deposit(userId, body);
      res.status(201).json(result);
    } catch (err) {
      this.forward(err, next);
    }
  };

  withdraw = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.id;
      if (!userId) {
        next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
        return;
      }
      const body = withdrawBodySchema.parse(req.body);
      const result = await this.banking.withdraw(userId, body);
      res.status(201).json(result);
    } catch (err) {
      this.forward(err, next);
    }
  };

  transfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.id;
      if (!userId) {
        next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
        return;
      }
      const body = transferBodySchema.parse(req.body);
      const result = await this.banking.transfer(userId, body);
      res.status(201).json(result);
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
