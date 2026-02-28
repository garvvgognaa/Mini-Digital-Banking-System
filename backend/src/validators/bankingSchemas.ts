import { z } from "zod";

const uuid = z.string().uuid();

export const depositBodySchema = z.object({
  referenceId: uuid,
  toAccountId: uuid,
  amount: z.string().min(1),
  description: z.string().max(500).optional().nullable(),
});

export const withdrawBodySchema = z.object({
  referenceId: uuid,
  fromAccountId: uuid,
  amount: z.string().min(1),
  description: z.string().max(500).optional().nullable(),
});

export const transferBodySchema = z.object({
  referenceId: uuid,
  fromAccountId: uuid,
  toAccountId: uuid,
  amount: z.string().min(1),
  description: z.string().max(500).optional().nullable(),
});
