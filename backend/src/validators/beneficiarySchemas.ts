import { z } from "zod";

export const createBeneficiaryBodySchema = z.object({
  beneficiaryAccountId: z.string().uuid(),
  nickname: z.string().trim().min(1).max(100),
});

export const beneficiaryIdParamsSchema = z.object({
  beneficiaryId: z.string().uuid(),
});
