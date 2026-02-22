export type AccountStatus = "ACTIVE" | "FROZEN" | "CLOSED";
export type AccountType = "SAVINGS" | "CURRENT";

export interface AccountRow {
  id: string;
  user_id: string;
  account_number: string;
  account_type: AccountType;
  balance: string;
  status: AccountStatus;
  created_at: Date;
  updated_at: Date;
}
