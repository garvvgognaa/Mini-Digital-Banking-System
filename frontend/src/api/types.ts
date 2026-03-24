export type AccountType = "SAVINGS" | "CURRENT";
export type AccountStatus = "ACTIVE" | "FROZEN" | "CLOSED";
export type TxType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
export type TxStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  accountType: AccountType;
  balance: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface TransactionItem {
  id: string;
  referenceId: string;
  type: TxType;
  amount: string;
  status: TxStatus;
  fromAccountId: string | null;
  toAccountId: string | null;
  description: string | null;
  createdAt: string;
}

export interface TransactionsResponse {
  items: TransactionItem[];
  limit: number;
  offset: number;
}

export interface BeneficiaryView {
  id: string;
  nickname: string;
  beneficiaryAccountId: string;
  accountNumber: string;
  accountType: string;
  beneficiaryUserName: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}
