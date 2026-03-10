import { z } from "zod";

export const createAccountBodySchema = z.object({
  accountType: z.enum(["SAVINGS", "CURRENT"]),
});

const uuidParam = z.string().uuid();

export const accountIdParamsSchema = z.object({
  accountId: uuidParam,
});

export const accountTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
