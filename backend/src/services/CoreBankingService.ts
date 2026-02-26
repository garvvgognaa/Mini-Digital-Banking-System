import type { PoolConnection } from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../common/errors/AppError";
import { parseMoney } from "../common/money";
import { isDuplicateKeyError } from "../common/dbErrors";
import type { AccountRow } from "../models/Account";
import type { MovementType, TransactionRow } from "../models/TransactionRecord";
import { AccountRepository } from "../repositories/AccountRepository";
import { TransactionRepository, type PendingMovement } from "../repositories/TransactionRepository";
import { TransactionRunner } from "../db/TransactionRunner";

export interface MovementResult {
  transactionId: string;
  referenceId: string;
  type: MovementType;
  amount: string;
  status: "SUCCESS" | "FAILED";
  fromAccountId: string | null;
  toAccountId: string | null;
}

/**
 * Orchestrates monetary movements with one InnoDB transaction per request.
 * Uses row-level locks (SELECT ... FOR UPDATE) and single-statement debits to prevent double spending.
 */
export class CoreBankingService {
  constructor(
    private readonly runner: TransactionRunner,
    private readonly accounts: AccountRepository,
    private readonly ledger: TransactionRepository
  ) { }

  async deposit(input: {
    referenceId: string;
    toAccountId: string;
    amount: unknown;
    description?: string | null;
  }): Promise<MovementResult> {
    const amount = parseMoney(input.amount);
    const result = await this.runner.run(async (conn) => {
      const movementId = uuidv4();
      const inserted = await this.tryInsertPending(conn, {
        id: movementId,
        referenceId: input.referenceId,
        fromAccountId: null,
        toAccountId: input.toAccountId,
        type: "DEPOSIT",
        amount,
        description: input.description ?? null,
      });
      if (!inserted) {
        return this.shortCircuitExisting(conn, input.referenceId, {
          type: "DEPOSIT",
          fromAccountId: null,
          toAccountId: input.toAccountId,
          amount,
        });
      }

      const toAccount = await this.accounts.findByIdForUpdate(conn, input.toAccountId);
      this.assertAccountUsable(toAccount, input.toAccountId);

      const credited = await this.accounts.credit(conn, input.toAccountId, amount);
      if (!credited) {
        throw new AppError(500, "INTERNAL_ERROR", "Deposit could not be applied.");
      }

      await this.ledger.updateStatus(conn, movementId, "SUCCESS");
      return this.toResult(movementId, input.referenceId, "DEPOSIT", amount, "SUCCESS", null, input.toAccountId);
    });

    if (!result) {
      throw new AppError(500, "INTERNAL_ERROR", "Unexpected empty result from deposit transaction.");
    }
    return result;
  }

  async withdraw(input: {
    referenceId: string;
    fromAccountId: string;
    amount: unknown;
    description?: string | null;
  }): Promise<MovementResult> {
    const amount = parseMoney(input.amount);
    let rejection: AppError | null = null;
    const result = await this.runner.run(async (conn) => {
      const movementId = uuidv4();
      const inserted = await this.tryInsertPending(conn, {
        id: movementId,
        referenceId: input.referenceId,
        fromAccountId: input.fromAccountId,
        toAccountId: null,
        type: "WITHDRAWAL",
        amount,
        description: input.description ?? null,
      });
      if (!inserted) {
        return this.shortCircuitExisting(conn, input.referenceId, {
          type: "WITHDRAWAL",
          fromAccountId: input.fromAccountId,
          toAccountId: null,
          amount,
        });
      }

      const fromAccount = await this.accounts.findByIdForUpdate(conn, input.fromAccountId);
      this.assertAccountUsable(fromAccount, input.fromAccountId);

      const debited = await this.accounts.tryDebit(conn, input.fromAccountId, amount);
      if (!debited) {
        await this.ledger.updateStatus(conn, movementId, "FAILED");
        rejection = new AppError(400, "INSUFFICIENT_FUNDS", "Account balance is insufficient for this withdrawal.");
        return null;
      }

      await this.ledger.updateStatus(conn, movementId, "SUCCESS");
      return this.toResult(
        movementId,
        input.referenceId,
        "WITHDRAWAL",
        amount,
        "SUCCESS",
        input.fromAccountId,
        null
      );
    });

    if (rejection) throw rejection;
    if (!result) {
      throw new AppError(500, "INTERNAL_ERROR", "Unexpected empty result from withdrawal transaction.");
    }
    return result;
  }

  async transfer(input: {
    referenceId: string;
    fromAccountId: string;
    toAccountId: string;
    amount: unknown;
    description?: string | null;
  }): Promise<MovementResult> {
    if (input.fromAccountId === input.toAccountId) {
      throw new AppError(400, "VALIDATION_ERROR", "Source and destination accounts must differ.");
    }

    const amount = parseMoney(input.amount);
    let rejection: AppError | null = null;
    const result = await this.runner.run(async (conn) => {
      const movementId = uuidv4();
      const inserted = await this.tryInsertPending(conn, {
        id: movementId,
        referenceId: input.referenceId,
        fromAccountId: input.fromAccountId,
        toAccountId: input.toAccountId,
        type: "TRANSFER",
        amount,
        description: input.description ?? null,
      });
      if (!inserted) {
        return this.shortCircuitExisting(conn, input.referenceId, {
          type: "TRANSFER",
          fromAccountId: input.fromAccountId,
          toAccountId: input.toAccountId,
          amount,
        });
      }

      const [firstId, secondId] =
        input.fromAccountId < input.toAccountId
          ? [input.fromAccountId, input.toAccountId]
          : [input.toAccountId, input.fromAccountId];

      const first = await this.accounts.findByIdForUpdate(conn, firstId);
      this.assertAccountUsable(first, firstId);
      const second = await this.accounts.findByIdForUpdate(conn, secondId);
      this.assertAccountUsable(second, secondId);

      const fromAccount = firstId === input.fromAccountId ? first : second;
      if (!fromAccount || fromAccount.id !== input.fromAccountId) {
        throw new AppError(500, "INTERNAL_ERROR", "Invariant violated while locking transfer accounts.");
      }

      const debited = await this.accounts.tryDebit(conn, input.fromAccountId, amount);
      if (!debited) {
        await this.ledger.updateStatus(conn, movementId, "FAILED");
        rejection = new AppError(400, "INSUFFICIENT_FUNDS", "Account balance is insufficient for this transfer.");
        return null;
      }

      const credited = await this.accounts.credit(conn, input.toAccountId, amount);
      if (!credited) {
        throw new AppError(500, "INTERNAL_ERROR", "Transfer credit could not be applied.");
      }

      await this.ledger.updateStatus(conn, movementId, "SUCCESS");
      return this.toResult(
        movementId,
        input.referenceId,
        "TRANSFER",
        amount,
        "SUCCESS",
        input.fromAccountId,
        input.toAccountId
      );
    });

    if (rejection) throw rejection;
    if (!result) {
      throw new AppError(500, "INTERNAL_ERROR", "Unexpected empty result from transfer transaction.");
    }
    return result;
  }

  private async tryInsertPending(conn: PoolConnection, row: PendingMovement): Promise<boolean> {
    try {
      await this.ledger.insertPending(conn, row);
      return true;
    } catch (err) {
      if (isDuplicateKeyError(err)) return false;
      throw err;
    }
  }

  private async shortCircuitExisting(
    conn: PoolConnection,
    referenceId: string,
    expected: {
      type: MovementType;
      fromAccountId: string | null;
      toAccountId: string | null;
      amount: string;
    }
  ): Promise<MovementResult> {
    const existing = await this.ledger.findByReferenceForUpdate(conn, referenceId);
    if (!existing) {
      throw new AppError(409, "CONFLICT", "Duplicate reference could not be resolved.");
    }
    if (existing.type !== expected.type) {
      throw new AppError(
        409,
        "CONFLICT",
        "This reference_id is already tied to a different movement type."
      );
    }
    if (existing.status === "SUCCESS") {
      if (
        existing.from_account_id !== expected.fromAccountId ||
        existing.to_account_id !== expected.toAccountId
      ) {
        throw new AppError(
          409,
          "CONFLICT",
          "This reference_id was already executed with different accounts."
        );
      }
      if (existing.amount !== expected.amount) {
        throw new AppError(
          409,
          "CONFLICT",
          "This reference_id was already executed with a different amount."
        );
      }
      return this.rowToResult(existing);
    }
    if (existing.status === "FAILED") {
      throw new AppError(
        409,
        "CONFLICT",
        "This reference_id was already used for a failed movement; use a new idempotency key."
      );
    }
    throw new AppError(409, "CONFLICT", "This reference_id is already being processed.");
  }

  private assertAccountUsable(account: AccountRow | null, accountId: string): void {
    if (!account) {
      throw new AppError(404, "NOT_FOUND", `Account ${accountId} was not found.`);
    }
    if (account.status !== "ACTIVE") {
      throw new AppError(400, "ACCOUNT_INACTIVE", `Account ${accountId} is not active.`);
    }
  }

  private rowToResult(row: TransactionRow): MovementResult {
    if (row.status !== "SUCCESS") {
      throw new AppError(500, "INTERNAL_ERROR", "shortCircuitExisting expected a SUCCESS ledger row.");
    }
    return this.toResult(
      row.id,
      row.reference_id,
      row.type,
      row.amount,
      "SUCCESS",
      row.from_account_id,
      row.to_account_id
    );
  }

  private toResult(
    transactionId: string,
    referenceId: string,
    type: MovementType,
    amount: string,
    status: "SUCCESS" | "FAILED",
    fromAccountId: string | null,
    toAccountId: string | null
  ): MovementResult {
    return {
      transactionId,
      referenceId,
      type,
      amount,
      status,
      fromAccountId,
      toAccountId,
    };
  }
}
