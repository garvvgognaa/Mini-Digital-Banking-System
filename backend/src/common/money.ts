import { z } from "zod";

const moneyString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a positive decimal with at most 2 fractional digits")
  .refine((v) => {
    const [whole] = v.split(".");
    return whole.length <= 13;
  }, "Amount is too large");

export type MoneyString = z.infer<typeof moneyString>;

export function parseMoney(amount: unknown): MoneyString {
  return moneyString.parse(amount);
}
