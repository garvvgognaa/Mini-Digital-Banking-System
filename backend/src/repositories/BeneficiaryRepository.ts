import { getPool } from "../db/pool";
import type { BeneficiaryRow } from "../models/Beneficiary";

export class BeneficiaryRepository {
  async listByOwner(ownerUserId: string): Promise<BeneficiaryRow[]> {
    const pool = getPool();
    const result = await pool.query<BeneficiaryRow>(
      `SELECT b.id, b.owner_user_id, b.beneficiary_account_id, b.nickname, b.created_at
       FROM beneficiaries b
       WHERE b.owner_user_id = $1
       ORDER BY b.created_at DESC`,
      [ownerUserId]
    );
    return result.rows;
  }

  async findByOwnerAndId(ownerUserId: string, beneficiaryId: string): Promise<BeneficiaryRow | null> {
    const pool = getPool();
    const result = await pool.query<BeneficiaryRow>(
      `SELECT id, owner_user_id, beneficiary_account_id, nickname, created_at
       FROM beneficiaries
       WHERE owner_user_id = $1 AND id = $2
       LIMIT 1`,
      [ownerUserId, beneficiaryId]
    );
    return result.rows[0] ?? null;
  }

  async findByOwnerAndAccountId(
    ownerUserId: string,
    beneficiaryAccountId: string
  ): Promise<BeneficiaryRow | null> {
    const pool = getPool();
    const result = await pool.query<BeneficiaryRow>(
      `SELECT id, owner_user_id, beneficiary_account_id, nickname, created_at
       FROM beneficiaries
       WHERE owner_user_id = $1 AND beneficiary_account_id = $2
       LIMIT 1`,
      [ownerUserId, beneficiaryAccountId]
    );
    return result.rows[0] ?? null;
  }

  async insert(row: {
    id: string;
    ownerUserId: string;
    beneficiaryAccountId: string;
    nickname: string;
  }): Promise<void> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO beneficiaries (id, owner_user_id, beneficiary_account_id, nickname)
       VALUES ($1, $2, $3, $4)`,
      [row.id, row.ownerUserId, row.beneficiaryAccountId, row.nickname]
    );
    if (result.rowCount !== 1) {
      throw new Error("Beneficiary insert did not affect a row.");
    }
  }

  async delete(ownerUserId: string, beneficiaryId: string): Promise<boolean> {
    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM beneficiaries WHERE owner_user_id = $1 AND id = $2`,
      [ownerUserId, beneficiaryId]
    );
    return result.rowCount === 1;
  }
}
