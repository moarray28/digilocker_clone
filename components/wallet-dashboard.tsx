"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type WalletDocument = {
  id: string;
  issuer_name: string;
  issuer_certificate_reference: string;
  integrity_verified: boolean;
  signature_verified: boolean;
  current_status: string;
  status_checked_at: string | null;
  created_at: string;
};

export function WalletDashboard({ email }: { email: string }) {
  const [documents, setDocuments] = useState<WalletDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const idempotencyKey = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/documents", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Wallet is unavailable.");
      setDocuments(result.documents);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Wallet is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Checking the sample issuer and certificate…");
    const form = new FormData(event.currentTarget);
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify({
          studentName: form.get("studentName"), seatNumber: form.get("seatNumber"),
          examYear: Number(form.get("examYear")), educationLevel: form.get("educationLevel"),
        }),
      });
      const result = await response.json();
      idempotencyKey.current = null;
      if (!response.ok) {
        setMessage(result.error ?? "The request could not be completed.");
        await refresh();
        return;
      }
      setMessage("Certificate retrieved. Integrity, issuer signature, and current status checks passed.");
      setShowForm(false);
      await refresh();
    } catch {
      setMessage("No response was received. Retry safely; the same request key will be reused.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="protected-wallet">
    <header className="wallet-top"><Link className="brand" href="/"><span className="brand-mark">▤</span><span>certi<span className="brand-light">wallet</span></span></Link><div className="wallet-account"><span>{email}</span><SignOutButton /></div></header>
    <section className="protected-content">
      <div className="dashboard-heading"><div><span className="empty-kicker">YOUR PRIVATE COLLECTION</span><h1>My documents</h1><p>Your verified certificates, in one place.</p></div><button className="primary-button" type="button" onClick={() => { setShowForm(!showForm); setMessage(""); }}>{showForm ? "Close" : "+ Get a document"}</button></div>
      {message && <p className="wallet-feedback" role="status">{message}</p>}
      {showForm && <form className="request-form-card wallet-real-form" onSubmit={submit}>
        <div className="request-card-heading"><span className="request-card-icon">▤</span><div><h2>Find an existing certificate</h2><p>Fictional fixture details only. No real student records.</p></div></div>
        <label className="request-field">Education level<select name="educationLevel" defaultValue="secondary"><option value="secondary">Secondary school certificate</option><option value="higher_secondary">Higher secondary certificate</option></select></label>
        <div className="request-field-grid"><label className="request-field">Student name<input name="studentName" autoComplete="off" defaultValue="Aarav Sample" required minLength={2} maxLength={100} /></label><label className="request-field">Seat number<input name="seatNumber" autoComplete="off" defaultValue="DEMO-25001" required minLength={4} maxLength={24} /></label></div>
        <label className="request-field request-year">Examination year<input name="examYear" type="number" min="2000" max="2100" defaultValue="2025" required /></label>
        <p className="request-hint">Matching sample fields only finds a synthetic fixture. It does not verify a real person&apos;s identity.</p>
        <button className="primary-button request-submit" disabled={busy}>{busy ? "Checking…" : "Retrieve certificate"}</button>
      </form>}
      {error ? <div className="protected-empty"><p className="auth-error">{error}</p><button className="secondary-button" onClick={() => void refresh()}>Try again</button></div> : loading ? <div className="protected-empty"><p>Loading your wallet…</p></div> : documents.length === 0 ? <div className="protected-empty"><span className="protected-icon">▤</span><h2>Your wallet is ready</h2><p>Retrieve an existing certificate from the simulated issuer. We check the file, issuer signature, and current status before saving it.</p><small>Synthetic test data only · Demo application</small><button className="secondary-button" onClick={() => setShowForm(true)}>Get a document</button></div> : <div className="wallet-document-list">{documents.map((document) => <article className="wallet-document-card" key={document.id}><div className="wallet-document-icon">▤</div><div className="wallet-document-copy"><strong>School certificate</strong><span>{document.issuer_name}</span><small>Issuer status checked {document.status_checked_at ? new Date(document.status_checked_at).toLocaleString() : "when opened"}</small><div className="wallet-checks"><span>File integrity confirmed</span><span>Issuer signature verified</span><span>Current status: {document.current_status}</span></div></div><a className="secondary-button" href={`/api/documents/${document.id}`} target="_blank" rel="noreferrer">Open PDF ↗</a><a className="document-download" href={`/api/documents/${document.id}?download=1`}>Download</a></article>)}</div>}
    </section>
  </main>;
}

function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function signOut() {
    setBusy(true);
    const { authClient } = await import("@/lib/auth-client");
    await authClient.signOut();
    router.push("/signin");
    router.refresh();
  }
  return <button className="signout-button" type="button" disabled={busy} onClick={() => void signOut()}>{busy ? "Signing out…" : "Sign out"}</button>;
}
