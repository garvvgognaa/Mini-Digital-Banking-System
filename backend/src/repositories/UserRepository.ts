import { getPool } from "../db/pool";
import type { UserRow } from "../models/User";

export class UserRepository {
  async findByEmail(email: string): Promise<UserRow | null> {
    const pool = getPool();
    const result = await pool.query<UserRow>(
      `SELECT id, name, email, password_hash, role, phone, is_active, created_at, updated_at
       FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase().trim()]
    );
    return result.rows[0] ?? null;
  }

  async findById(id: string): Promise<UserRow | null> {
    const pool = getPool();
    const result = await pool.query<UserRow>(
      `SELECT id, name, email, password_hash, role, phone, is_active, created_at, updated_at
       FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async insert(user: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    phone: string | null;
  }): Promise<void> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, phone, is_active)
       VALUES ($1, $2, $3, $4, 'CUSTOMER', $5, TRUE)`,
      [user.id, user.name, user.email, user.passwordHash, user.phone]
    );
    if (result.rowCount !== 1) {
      throw new Error("User insert did not affect a row.");
    }
  }
}
