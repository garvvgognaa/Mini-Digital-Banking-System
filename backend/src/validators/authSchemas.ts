import { z } from "zod";

export const registerBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(20).optional().nullable(),
});

export const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});
