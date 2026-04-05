import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import type { Account } from "../api/types";
import { formatCurrency, newReferenceId } from "../util/format";

export function DepositPage(): JSX.Element {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [toAccountId, setToAccountId] = useState("");
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
        setToAccountId((prev) => prev || list[0]?.id || "");
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
      await api.deposit({
        referenceId: newReferenceId(),
        toAccountId,
        amount: amount.trim(),
        description: description.trim() || null,
      });
      setSuccess("Deposit completed successfully.");
      setAmount("");
      setDescription("");
      const list = await api.listAccounts();
      setAccounts(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Deposit failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Deposit</h1>
        <p>Add money to one of your accounts.</p>
      </header>

      <div className="card" style={{ maxWidth: 480 }}>
        {error ? <div className="alert alert--error">{error}</div> : null}
        {success ? <div className="alert alert--success">{success}</div> : null}
        {accounts.length === 0 ? (
          <p className="empty-hint">Create an account from the dashboard first.</p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="form-group">
              <label htmlFor="to">Into account</label>
              <select id="to" className="select" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountType} · {a.accountNumber} · {formatCurrency(a.balance)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount (e.g. 100.00)</label>
              <input id="amount" className="input mono" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label htmlFor="desc">Note (optional)</label>
              <textarea id="desc" className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "Processing…" : "Deposit"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
