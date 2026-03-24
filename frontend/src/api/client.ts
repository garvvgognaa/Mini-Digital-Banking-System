import type { Account, ApiErrorBody, AuthResponse, BeneficiaryView, TransactionsResponse, User } from "./types";

const base = () => (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function getToken(): string | null {
  return localStorage.getItem("mdbs_token");
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem("mdbs_token", token);
  else localStorage.removeItem("mdbs_token");
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (!headers.has("Content-Type") && rest.body) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, { ...rest, headers });
  } catch (err) {
    const message =
      err instanceof TypeError
        ? "Cannot reach the server. Start the API on port 3000, or set VITE_API_URL to your backend URL."
        : "Network error.";
    throw new ApiError(0, message);
  }
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      throw new ApiError(res.status, text || "Unexpected response");
    }
  }

  if (!res.ok) {
    const body = json as ApiErrorBody | null;
    const message = body?.error?.message ?? res.statusText;
    const code = body?.error?.code;
    throw new ApiError(res.status, message, code);
  }

  return json as T;
}

export const api = {
  register(body: { name: string; email: string; password: string; phone?: string | null }): Promise<AuthResponse> {
    return request<AuthResponse>("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    });
  },

  login(body: { email: string; password: string }): Promise<AuthResponse> {
    return request<AuthResponse>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    });
  },

  listAccounts(): Promise<Account[]> {
    return request<Account[]>("/v1/accounts");
  },

  createAccount(body: { accountType: "SAVINGS" | "CURRENT" }): Promise<Account> {
    return request<Account>("/v1/accounts", { method: "POST", body: JSON.stringify(body) });
  },

  getAccount(accountId: string): Promise<Account> {
    return request<Account>(`/v1/accounts/${accountId}`);
  },

  listTransactions(accountId: string, limit = 50, offset = 0): Promise<TransactionsResponse> {
    const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return request<TransactionsResponse>(`/v1/accounts/${accountId}/transactions?${q}`);
  },

  deposit(body: {
    referenceId: string;
    toAccountId: string;
    amount: string;
    description?: string | null;
  }): Promise<unknown> {
    return request("/v1/banking/deposits", { method: "POST", body: JSON.stringify(body) });
  },

  withdraw(body: {
    referenceId: string;
    fromAccountId: string;
    amount: string;
    description?: string | null;
  }): Promise<unknown> {
    return request("/v1/banking/withdrawals", { method: "POST", body: JSON.stringify(body) });
  },

  transfer(body: {
    referenceId: string;
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    description?: string | null;
  }): Promise<unknown> {
    return request("/v1/banking/transfers", { method: "POST", body: JSON.stringify(body) });
  },

  listBeneficiaries(): Promise<BeneficiaryView[]> {
    return request<BeneficiaryView[]>("/v1/beneficiaries");
  },
};

export function loadStoredUser(): User | null {
  const raw = localStorage.getItem("mdbs_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: User | null): void {
  if (user) localStorage.setItem("mdbs_user", JSON.stringify(user));
  else localStorage.removeItem("mdbs_user");
}
