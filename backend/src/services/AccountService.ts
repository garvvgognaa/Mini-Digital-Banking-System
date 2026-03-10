import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../common/errors/AppError";
import type { AccountRow } from "../models/Account";
import { AccountRepository } from "../repositories/AccountRepository";

function randomDigit12(): string {
  let out = "";
  for (let i = 0; i < 12; i += 1) {
    out += crypto.randomInt(0, 10).toString();
  }
  return out;
}

export class AccountService {
  constructor(private readonly accounts: AccountRepository) { }

  async createAccount(userId: string, accountType: AccountRow["account_type"]): Promise<AccountRow> {
    const id = uuidv4();
    let accountNumber = randomDigit12();
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const taken = await this.accounts.isAccountNumberTaken(accountNumber);
      if (!taken) break;
      accountNumber = randomDigit12();
      if (attempt === 11) {
        throw new AppError(500, "INTERNAL_ERROR", "Could not allocate a unique account number.");
      }
    }

    await this.accounts.insertAccount({
      id,
      userId,
      accountNumber,
      accountType,
    });

    const created = await this.accounts.findById(id);
    if (!created) {
      throw new AppError(500, "INTERNAL_ERROR", "Account was created but could not be loaded.");
    }
    return created;
  }

  async listAccounts(userId: string): Promise<AccountRow[]> {
    return this.accounts.listByUserId(userId);
  }

  async getAccountForUser(accountId: string, userId: string): Promise<AccountRow> {
    const row = await this.accounts.findByIdForUser(accountId, userId);
    if (!row) {
      throw new AppError(404, "NOT_FOUND", "Account not found.");
    }
    return row;
  }
}
