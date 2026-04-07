import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import type { Account, BeneficiaryView } from "../api/types";
import { formatCurrency, newReferenceId } from "../util/format";

export function TransferPage(): JSX.Element {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryView[]>([]);
  const [fromAccountId, setFromAccountId] = useState("");
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
        const [list, ben] = await Promise.all([api.listAccounts(), api.listBeneficiaries().catch(() => [])]);
        if (cancelled) return;
        setAccounts(list);
        setBeneficiaries(ben);
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
      await api.transfer({
        referenceId: newReferenceId(),
        fromAccountId,
        toAccountId: toAccountId.trim(),
        amount: amount.trim(),
        description: description.trim() || null,
      });
      setSuccess("Transfer completed successfully.");
      setAmount("");
      setDescription("");
      setToAccountId("");
      const list = await api.listAccounts();
      setAccounts(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Transfer failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Transfer money</h1>
        <p>Send funds to another account. The destination must exist and belong to an active user.</p>
      </header>

      <div className="card" style={{ maxWidth: 520 }}>
        {error ? <div className="alert alert--error">{error}</div> : null}
        {success ? <div className="alert alert--success">{success}</div> : null}
        {accounts.length === 0 ? (
          <p className="empty-hint">Create an account from the dashboard first.</p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="form-group">
              <label htmlFor="from">From your account</label>
              <select id="from" className="select" value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountType} · {a.accountNumber} · {formatCurrency(a.balance)}
                  </option>
                ))}
              </select>
            </div>

            {beneficiaries.length > 0 ? (
              <div className="form-group">
                <label>Quick pick (beneficiaries)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {beneficiaries.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className="btn btn--outline"
                      style={{ fontSize: "0.8125rem" }}
                      onClick={() => setToAccountId(b.beneficiaryAccountId)}
                    >
                      {b.nickname}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="form-group">
              <label htmlFor="to">Destination account ID (UUID)</label>
              <input
                id="to"
                className="input mono"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                required
              />
              <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                Ask the recipient for their account ID from their MDBS profile.
              </small>
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
              {loading ? "Processing…" : "Send transfer"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
