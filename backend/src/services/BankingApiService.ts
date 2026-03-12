import { AppError } from "../common/errors/AppError";
import { AccountRepository } from "../repositories/AccountRepository";
import type { CoreBankingService, MovementResult } from "./CoreBankingService";

/**
 * Application-level banking API: enforces ownership and destination validity before delegating
 * to the core engine (which still guarantees ACID invariants).
 */
export class BankingApiService {
  constructor(
    private readonly core: CoreBankingService,
    private readonly accounts: AccountRepository
  ) { }

  async deposit(
    userId: string,
    input: {
      referenceId: string;
      toAccountId: string;
      amount: unknown;
      description?: string | null;
    }
  ): Promise<MovementResult> {
    await this.assertAccountOwned(userId, input.toAccountId);
    return this.core.deposit(input);
  }

  async withdraw(
    userId: string,
    input: {
      referenceId: string;
      fromAccountId: string;
      amount: unknown;
      description?: string | null;
    }
  ): Promise<MovementResult> {
    await this.assertAccountOwned(userId, input.fromAccountId);
    return this.core.withdraw(input);
  }

  async transfer(
    userId: string,
    input: {
      referenceId: string;
      fromAccountId: string;
      toAccountId: string;
      amount: unknown;
      description?: string | null;
    }
  ): Promise<MovementResult> {
    await this.assertAccountOwned(userId, input.fromAccountId);
    await this.assertDestinationAccountAndUser(input.toAccountId);
    return this.core.transfer(input);
  }

  private async assertAccountOwned(userId: string, accountId: string): Promise<void> {
    const row = await this.accounts.findByIdForUser(accountId, userId);
    if (!row) {
      throw new AppError(403, "FORBIDDEN", "You do not have access to this account.");
    }
    if (row.status !== "ACTIVE") {
      throw new AppError(400, "ACCOUNT_INACTIVE", "This account is not active.");
    }
  }

  private async assertDestinationAccountAndUser(toAccountId: string): Promise<void> {
    const ctx = await this.accounts.findDestinationContext(toAccountId);
    if (!ctx) {
      throw new AppError(404, "DESTINATION_NOT_FOUND", "Destination account does not exist.");
    }
    if (!ctx.ownerIsActive) {
      throw new AppError(400, "USER_INACTIVE", "Destination user is inactive.");
    }
    if (ctx.account.status !== "ACTIVE") {
      throw new AppError(400, "ACCOUNT_INACTIVE", "Destination account is not active.");
    }
  }
}
