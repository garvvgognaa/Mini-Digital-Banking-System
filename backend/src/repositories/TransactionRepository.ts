import type { PoolClient } from "pg";
import { getPool } from "../db/pool";
import type { MovementStatus, MovementType, TransactionRow } from "../models/TransactionRecord";

export interface PendingMovement {
  id: string;
  referenceId: string;
  fromAccountId: string | null;
  toAccountId: string | null;
  type: MovementType;
  amount: string;
  description: string | null;
}

/**
 * Persists financial movements. Status transitions occur inside the same DB transaction
 * as balance changes so observers never see a successful debit without a matching ledger row.
 */
export class TransactionRepository {
  async findByReferenceForUpdate(
    client: PoolClient,
    referenceId: string
  ): Promise<TransactionRow | null> {
    const result = await client.query<TransactionRow>(
      `SELECT id, reference_id, from_account_id, to_account_id, type, amount, status, description, created_at, updated_at
       FROM transactions
       WHERE reference_id = $1
       FOR UPDATE`,
      [referenceId]
    );
    return result.rows[0] ?? null;
  }

  async insertPending(client: PoolClient, row: PendingMovement): Promise<void> {
    await client.query(
      `INSERT INTO transactions (id, reference_id, from_account_id, to_account_id, type, amount, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7)`,
      [
        row.id,
        row.referenceId,
        row.fromAccountId,
        row.toAccountId,
        row.type,
        row.amount,
        row.description,
      ]
    );
  }

  async updateStatus(client: PoolClient, id: string, status: MovementStatus): Promise<void> {
    await client.query(`UPDATE transactions SET status = $1 WHERE id = $2`, [status, id]);
  }

  async listForAccount(accountId: string, limit: number, offset: number): Promise<TransactionRow[]> {
    const pool = getPool();
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
    const safeOffset = Math.max(Math.floor(offset), 0);
    
    const result = await pool.query<TransactionRow>(
      `SELECT id, reference_id, from_account_id, to_account_id, type, amount, status, description, created_at, updated_at
       FROM transactions
       WHERE (from_account_id = $1 OR to_account_id = $1)
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [accountId, safeLimit, safeOffset]
    );
    return result.rows;
  }
}
