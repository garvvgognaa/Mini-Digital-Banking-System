import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../common/errors/AppError";
import type { AccountService } from "../services/AccountService";
import type { TransactionRepository } from "../repositories/TransactionRepository";
import {
  accountIdParamsSchema,
  accountTransactionsQuerySchema,
  createAccountBodySchema,
} from "../validators/accountSchemas";

export class AccountController {
  constructor(
    private readonly accounts: AccountService,
    private readonly transactionRepository: TransactionRepository
  ) { }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = createAccountBodySchema.parse(req.body);
      const userId = req.auth?.id;
      if (!userId) {
        next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
        return;
      }
      const account = await this.accounts.createAccount(userId, body.accountType);
      res.status(201).json({
        id: account.id,
        accountNumber: account.account_number,
        accountType: account.account_type,
        balance: account.balance,
        status: account.status,
        createdAt: account.created_at,
      });
    } catch (err) {
      this.forward(err, next);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.id;
      if (!userId) {
        next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
        return;
      }
      const rows = await this.accounts.listAccounts(userId);
      res.json(
        rows.map((a) => ({
          id: a.id,
          accountNumber: a.account_number,
          accountType: a.account_type,
          balance: a.balance,
          status: a.status,
          createdAt: a.created_at,
        }))
      );
    } catch (err) {
      this.forward(err, next);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId } = accountIdParamsSchema.parse(req.params);
      const userId = req.auth?.id;
      if (!userId) {
        next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
        return;
      }
      const account = await this.accounts.getAccountForUser(accountId, userId);
      res.json({
        id: account.id,
        accountNumber: account.account_number,
        accountType: account.account_type,
        balance: account.balance,
        status: account.status,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
      });
    } catch (err) {
      this.forward(err, next);
    }
  };

  transactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId } = accountIdParamsSchema.parse(req.params);
      const query = accountTransactionsQuerySchema.parse(req.query);
      const userId = req.auth?.id;
      if (!userId) {
        next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
        return;
      }
      await this.accounts.getAccountForUser(accountId, userId);
      const rows = await this.transactionRepository.listForAccount(accountId, query.limit, query.offset);
      res.json({
        items: rows.map((t) => ({
          id: t.id,
          referenceId: t.reference_id,
          type: t.type,
          amount: t.amount,
          status: t.status,
          fromAccountId: t.from_account_id,
          toAccountId: t.to_account_id,
          description: t.description,
          createdAt: t.created_at,
        })),
        limit: query.limit,
        offset: query.offset,
      });
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
