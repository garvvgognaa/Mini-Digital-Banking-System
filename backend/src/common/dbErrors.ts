export function isDuplicateKeyError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; errno?: number; constraint?: string };
  if (e.code === "23505") return true; // PostgreSQL unique_violation
  if (e.code === "ER_DUP_ENTRY" || e.errno === 1062) return true; // MySQL
  return false;
}
