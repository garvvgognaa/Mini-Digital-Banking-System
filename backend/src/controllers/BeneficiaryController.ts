import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../common/errors/AppError";
import type { BeneficiaryService } from "../services/BeneficiaryService";
import { beneficiaryIdParamsSchema, createBeneficiaryBodySchema } from "../validators/beneficiarySchemas";

export class BeneficiaryController {
  constructor(private readonly beneficiaries: BeneficiaryService) { }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.id;
      if (!userId) {
        next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
        return;
      }
      const rows = await this.beneficiaries.list(userId);
      res.json(rows);
    } catch (err) {
      this.forward(err, next);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createBeneficiaryBodySchema.parse(req.body);
      const userId = req.auth?.id;
      if (!userId) {
        next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
        return;
      }
      const row = await this.beneficiaries.add(userId, body);
      res.status(201).json(row);
    } catch (err) {
      this.forward(err, next);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { beneficiaryId } = beneficiaryIdParamsSchema.parse(req.params);
      const userId = req.auth?.id;
      if (!userId) {
        next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
        return;
      }
      await this.beneficiaries.remove(userId, beneficiaryId);
      res.status(204).end();
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
