import { v4 as uuidv4 } from "uuid";
import { AppError } from "../common/errors/AppError";
import { isDuplicateKeyError } from "../common/dbErrors";
import { AccountRepository } from "../repositories/AccountRepository";
import { BeneficiaryRepository } from "../repositories/BeneficiaryRepository";
import { UserRepository } from "../repositories/UserRepository";

export interface BeneficiaryView {
  id: string;
  nickname: string;
  beneficiaryAccountId: string;
  accountNumber: string;
  accountType: string;
  beneficiaryUserName: string;
  createdAt: Date;
}

export class BeneficiaryService {
  constructor(
    private readonly beneficiaries: BeneficiaryRepository,
    private readonly accounts: AccountRepository,
    private readonly users: UserRepository
  ) { }

  async list(ownerUserId: string): Promise<BeneficiaryView[]> {
    const rows = await this.beneficiaries.listByOwner(ownerUserId);
    const views: BeneficiaryView[] = [];
    for (const b of rows) {
      const ctx = await this.accounts.findDestinationContext(b.beneficiary_account_id);
      if (!ctx) continue;
      const beneficiaryUser = await this.users.findById(ctx.ownerUserId);
      views.push({
        id: b.id,
        nickname: b.nickname,
        beneficiaryAccountId: b.beneficiary_account_id,
        accountNumber: ctx.account.account_number,
        accountType: ctx.account.account_type,
        beneficiaryUserName: beneficiaryUser?.name ?? "Unknown",
        createdAt: b.created_at,
      });
    }
    return views;
  }

  async add(ownerUserId: string, input: { beneficiaryAccountId: string; nickname: string }): Promise<BeneficiaryView> {
    if (input.beneficiaryAccountId.trim().length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "beneficiaryAccountId is required.");
    }
    const ctx = await this.accounts.findDestinationContext(input.beneficiaryAccountId);
    if (!ctx) {
      throw new AppError(404, "DESTINATION_NOT_FOUND", "Beneficiary account or user does not exist.");
    }
    if (!ctx.ownerIsActive) {
      throw new AppError(400, "USER_INACTIVE", "Beneficiary user is inactive.");
    }
    if (ctx.account.status !== "ACTIVE") {
      throw new AppError(400, "ACCOUNT_INACTIVE", "Beneficiary account is not active.");
    }

    const id = uuidv4();
    try {
      await this.beneficiaries.insert({
        id,
        ownerUserId,
        beneficiaryAccountId: input.beneficiaryAccountId,
        nickname: input.nickname.trim(),
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new AppError(409, "CONFLICT", "This account is already in your beneficiaries list.");
      }
      throw err;
    }

    const row = await this.beneficiaries.findByOwnerAndId(ownerUserId, id);
    if (!row) {
      throw new AppError(500, "INTERNAL_ERROR", "Beneficiary could not be loaded after insert.");
    }
    const beneficiaryUser = await this.users.findById(ctx.ownerUserId);
    return {
      id: row.id,
      nickname: row.nickname,
      beneficiaryAccountId: row.beneficiary_account_id,
      accountNumber: ctx.account.account_number,
      accountType: ctx.account.account_type,
      beneficiaryUserName: beneficiaryUser?.name ?? "Unknown",
      createdAt: row.created_at,
    };
  }

  async remove(ownerUserId: string, beneficiaryId: string): Promise<void> {
    const ok = await this.beneficiaries.delete(ownerUserId, beneficiaryId);
    if (!ok) {
      throw new AppError(404, "NOT_FOUND", "Beneficiary not found.");
    }
  }
}
