export type UserRole = "CUSTOMER" | "ADMIN" | "BANK_TELLER";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  phone: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
