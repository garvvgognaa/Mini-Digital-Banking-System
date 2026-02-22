export type MovementType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
export type MovementStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface TransactionRow {
  id: string;
  reference_id: string;
  from_account_id: string | null;
  to_account_id: string | null;
  type: MovementType;
  amount: string;
  status: MovementStatus;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}
