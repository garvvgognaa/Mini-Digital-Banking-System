import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../api/client";
import type { Account, TransactionItem, TxStatus, TxType } from "../api/types";
import { formatCurrency, formatDate } from "../util/format";

export function TransactionsPage(): JSX.Element {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"" | TxType>("");
  const [filterStatus, setFilterStatus] = useState<"" | TxStatus>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.listAccounts();
        if (cancelled) return;
        setAccounts(list);
        setAccountId((prev) => prev || list[0]?.id || "");
      } catch {
        /* list accounts failed — table stays empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.listTransactions(accountId, 100, 0);
        if (cancelled) return;
        setItems(res.items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load transactions.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const filtered = useMemo(() => {
    return items.filter((t) => {
      if (filterType && t.type !== filterType) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      return true;
    });
  }, [items, filterType, filterStatus]);

  return (
    <>
      <header className="page-header">
        <h1>Transaction history</h1>
        <p>Review movements with simple filters.</p>
      </header>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="filters">
          <div className="form-group">
            <label htmlFor="acct">Account</label>
            <select id="acct" className="select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.length === 0 ? <option value="">No accounts</option> : null}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountType} · {a.accountNumber}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="ftype">Type</label>
            <select id="ftype" className="select" value={filterType} onChange={(e) => setFilterType(e.target.value as "" | TxType)}>
              <option value="">All</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="fstat">Status</label>
            <select id="fstat" className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "" | TxStatus)}>
              <option value="">All</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="card empty-hint">No accounts to show history for.</div>
      ) : loading ? (
        <p className="empty-hint">Loading…</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap" style={{ border: "none" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                      No transactions match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id}>
                      <td className="mono" style={{ whiteSpace: "nowrap" }}>
                        {formatDate(t.createdAt)}
                      </td>
                      <td>
                        <span className="badge badge--type">{t.type}</span>
                      </td>
                      <td className="mono">{formatCurrency(t.amount)}</td>
                      <td>
                        <span
                          className={`badge ${t.status === "SUCCESS" ? "badge--success" : t.status === "FAILED" ? "badge--failed" : "badge--pending"
                            }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="mono" style={{ fontSize: "0.75rem", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.referenceId}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
