import type { Pool, PoolClient } from "pg";

/**
 * Centralizes ACID boundaries: one client, explicit BEGIN / COMMIT / ROLLBACK.
 * Repositories receive the same client so all work participates in one atomic unit.
 */
export class TransactionRunner {
  constructor(private readonly pool: Pool) { }

  async run<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}
