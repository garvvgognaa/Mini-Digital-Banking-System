import type { PoolClient } from "pg";
import { getPool } from "../db/pool";
import type { AccountRow } from "../models/Account";

export interface AccountWithOwnerContext {
  account: AccountRow;
  ownerUserId: string;
  ownerIsActive: boolean;
}

/**
 * Data access for accounts. Pool reads for queries; transactional writes use an injected connection.
 */
export class AccountRepository {
  async findById(id: string): Promise<AccountRow | null> {
    const pool = getPool();
    const result = await pool.query<AccountRow>(
      `SELECT id, user_id, account_number, account_type, balance, status, created_at, updated_at
       FROM accounts WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByIdForUser(accountId: string, userId: string): Promise<AccountRow | null> {
    const pool = getPool();
    const result = await pool.query<AccountRow>(
      `SELECT id, user_id, account_number, account_type, balance, status, created_at, updated_at
       FROM accounts
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [accountId, userId]
    );
    return result.rows[0] ?? null;
  }

  async listByUserId(userId: string): Promise<AccountRow[]> {
    const pool = getPool();
    const result = await pool.query<AccountRow>(
      `SELECT id, user_id, account_number, account_type, balance, status, created_at, updated_at
       FROM accounts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Resolves destination account and owning user for transfer validation.
   */
  async findDestinationContext(accountId: string): Promise<AccountWithOwnerContext | null> {
    const pool = getPool();
    type Row = AccountRow & { owner_user_id: string; owner_is_active: boolean };
    const result = await pool.query<Row>(
      `SELECT a.id, a.user_id, a.account_number, a.account_type, a.balance, a.status, a.created_at, a.updated_at,
              u.id AS owner_user_id,
              u.is_active AS owner_is_active
       FROM accounts a
       INNER JOIN users u ON u.id = a.user_id
       WHERE a.id = $1
       LIMIT 1`,
      [accountId]
    );
    const row = result.rows[0];
    if (!row) return null;
    const account: AccountRow = {
      id: row.id,
      user_id: row.user_id,
      account_number: row.account_number,
      account_type: row.account_type,
      balance: row.balance,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
    return {
      account,
      ownerUserId: row.owner_user_id,
      ownerIsActive: row.owner_is_active,
    };
  }

  async isAccountNumberTaken(accountNumber: string): Promise<boolean> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 1 FROM accounts WHERE account_number = $1 LIMIT 1`,
      [accountNumber]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async insertAccount(account: {
    id: string;
    userId: string;
    accountNumber: string;
    accountType: AccountRow["account_type"];
  }): Promise<void> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO accounts (id, user_id, account_number, account_type, balance, status)
       VALUES ($1, $2, $3, $4, 0.00, 'ACTIVE')`,
      [account.id, account.userId, account.accountNumber, account.accountType]
    );
    if (result.rowCount !== 1) {
      throw new Error("Account insert did not affect a row.");
    }
  }

  async findByIdForUpdate(client: PoolClient, id: string): Promise<AccountRow | null> {
    const result = await client.query<AccountRow>(
      `SELECT id, user_id, account_number, account_type, balance, status, created_at, updated_at
       FROM accounts
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async credit(client: PoolClient, accountId: string, amount: string): Promise<boolean> {
    const result = await client.query(
      `UPDATE accounts
       SET balance = balance + $1
       WHERE id = $2`,
      [amount, accountId]
    );
    return result.rowCount === 1;
  }

  async tryDebit(client: PoolClient, accountId: string, amount: string): Promise<boolean> {
    const result = await client.query(
      `UPDATE accounts
       SET balance = balance - $1
       WHERE id = $2 AND balance >= $3`,
      [amount, accountId, amount]
    );
    return result.rowCount === 1;
  }
}
