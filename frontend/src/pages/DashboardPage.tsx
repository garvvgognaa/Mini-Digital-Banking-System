import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { Account, TransactionItem } from "../api/types";
import { formatCurrency, formatDate } from "../util/format";

export function DashboardPage(): JSX.Element {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recent, setRecent] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await api.listAccounts();
      setAccounts(list);
      if (list[0]) {
        const tx = await api.listTransactions(list[0].id, 8, 0);
        setRecent(tx.items);
      } else {
        setRecent([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const totalBalance = useMemo(() => {
    const sum = accounts.reduce((acc, a) => acc + Number.parseFloat(a.balance || "0"), 0);
    return sum.toFixed(2);
  }, [accounts]);

  async function openAccount(type: "SAVINGS" | "CURRENT"): Promise<void> {
    setCreateMsg(null);
    setCreating(true);
    try {
      await api.createAccount({ accountType: type });
      setCreateMsg(`New ${type.toLowerCase()} account opened.`);
      await refresh();
    } catch (err) {
      setCreateMsg(err instanceof ApiError ? err.message : "Could not create account.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your balances and recent activity.</p>
      </header>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {createMsg ? (
        <div className={createMsg.includes("opened") ? "alert alert--success" : "alert alert--error"}>{createMsg}</div>
      ) : null}

      {loading ? (
        <p className="empty-hint">Loading…</p>
      ) : (
        <>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="card__title">Total balance</div>
            <div className="card__value mono">{formatCurrency(totalBalance)}</div>
            <p style={{ margin: "0.75rem 0 0", fontSize: "0.875rem" }}>
              Across {accounts.length} account{accounts.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="quick-actions">
            <Link to="/deposit" className="quick-action">
              <div className="card card--clickable">
                <div className="quick-action__icon" aria-hidden>
                  ↓
                </div>
                <div className="card__title">Deposit</div>
                <p style={{ margin: 0, fontSize: "0.8125rem" }}>Add funds</p>
              </div>
            </Link>
            <Link to="/withdraw" className="quick-action">
              <div className="card card--clickable">
                <div className="quick-action__icon" aria-hidden>
                  ↑
                </div>
                <div className="card__title">Withdraw</div>
                <p style={{ margin: 0, fontSize: "0.8125rem" }}>Cash out</p>
              </div>
            </Link>
            <Link to="/transfer" className="quick-action">
              <div className="card card--clickable">
                <div className="quick-action__icon" aria-hidden>
                  ⇄
                </div>
                <div className="card__title">Transfer</div>
                <p style={{ margin: 0, fontSize: "0.8125rem" }}>Send to someone</p>
              </div>
            </Link>
          </div>

          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <h2 style={{ margin: 0 }}>Your accounts</h2>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" className="btn btn--outline" disabled={creating} onClick={() => void openAccount("SAVINGS")}>
                + Savings
              </button>
              <button type="button" className="btn btn--outline" disabled={creating} onClick={() => void openAccount("CURRENT")}>
                + Current
              </button>
            </div>
          </div>

          {accounts.length === 0 ? (
            <div className="card empty-hint">No accounts yet. Open a savings or current account to get started.</div>
          ) : (
            <div className="grid-2">
              {accounts.map((a) => (
                <div key={a.id} className="card">
                  <div className="card__title">{a.accountType}</div>
                  <div className="card__value mono" style={{ fontSize: "1.35rem" }}>
                    {formatCurrency(a.balance)}
                  </div>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem" }}>
                    <span className="mono">{a.accountNumber}</span>
                    <span style={{ color: "var(--color-text-muted)" }}> · {a.status}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ margin: "1.75rem 0 0.75rem" }}>Recent transactions</h2>
          {accounts.length === 0 ? null : recent.length === 0 ? (
            <div className="card empty-hint">No transactions yet on your primary account.</div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {recent.map((t) => (
                  <li
                    key={t.id}
                    style={{
                      padding: "0.85rem 1.25rem",
                      borderBottom: "1px solid var(--color-border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "0.9375rem" }}>{t.type}</strong>
                      <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{formatDate(t.createdAt)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="mono" style={{ fontWeight: 600 }}>
                        {formatCurrency(t.amount)}
                      </span>
                      <div>
                        <span
                          className={`badge ${t.status === "SUCCESS" ? "badge--success" : t.status === "FAILED" ? "badge--failed" : "badge--pending"
                            }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div style={{ padding: "0.75rem 1.25rem", background: "#f8fafc" }}>
                <Link to="/transactions">View full history →</Link>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
