import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import type { Account } from "../api/types";
import { formatCurrency, newReferenceId } from "../util/format";

export function WithdrawPage(): JSX.Element {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.listAccounts();
        if (cancelled) return;
        setAccounts(list);
        setFromAccountId((prev) => prev || list[0]?.id || "");
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await api.withdraw({
        referenceId: newReferenceId(),
        fromAccountId,
        amount: amount.trim(),
        description: description.trim() || null,
      });
      setSuccess("Withdrawal completed successfully.");
      setAmount("");
      setDescription("");
      const list = await api.listAccounts();
      setAccounts(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Withdrawal failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Withdraw</h1>
        <p>Move funds out of your account. Insufficient balance will be rejected.</p>
      </header>

      <div className="card" style={{ maxWidth: 480 }}>
        {error ? <div className="alert alert--error">{error}</div> : null}
        {success ? <div className="alert alert--success">{success}</div> : null}
        {accounts.length === 0 ? (
          <p className="empty-hint">Create an account from the dashboard first.</p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="form-group">
              <label htmlFor="from">From account</label>
              <select id="from" className="select" value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountType} · {a.accountNumber} · {formatCurrency(a.balance)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input id="amount" className="input mono" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label htmlFor="desc">Note (optional)</label>
              <textarea id="desc" className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "Processing…" : "Withdraw"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
