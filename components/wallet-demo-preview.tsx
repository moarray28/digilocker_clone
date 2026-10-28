"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

type View = "overview" | "documents" | "request" | "document";
type Scenario = "active" | "no_match" | "signature_invalid" | "revoked" | "superseded" | "issuer_unavailable";

const scenarios: Record<Scenario, { label: string; message: string; tone: string }> = {
  active: { label: "Active fixture", message: "Active-path preview only. No record lookup, signature verification, or status check has run.", tone: "notice" },
  no_match: { label: "No matching record", message: "No sample record matched these synthetic details. This is preview text only; no issuer was contacted.", tone: "notice" },
  signature_invalid: { label: "Invalid signature", message: "The issuer signature could not be verified. Document display and download are unavailable.", tone: "danger" },
  revoked: { label: "Revoked certificate", message: "The simulated issuer reports this certificate as revoked. Document display and download are unavailable.", tone: "danger" },
  superseded: { label: "Superseded certificate", message: "The simulated issuer reports that a newer certificate replaced this one. Document display and download are unavailable.", tone: "danger" },
  issuer_unavailable: { label: "Issuer unavailable", message: "Unable to confirm certificate status. Try again later. Document display and download are unavailable.", tone: "warning" },
};

function Icon({ name, size = 18 }: { name: "grid" | "file" | "plus" | "shield" | "search" | "arrow" | "back" | "clock" | "check" | "lock" | "chevron"; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10"/></>,
    back: <><path d="m15 18-6-6 6-6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Brand() {
  return <Link className="brand" href="/" aria-label="Certificate Wallet preview"><span className="brand-mark"><Icon name="file" size={17}/></span><span>certi<span className="brand-light">wallet</span></span></Link>;
}

function PreviewBanner() {
  return <div className="preview-banner"><span className="preview-banner-icon"><Icon name="shield" size={16}/></span><div><strong>Visual preview only</strong><span>No issuer request was sent. No certificate has been retrieved or verified.</span></div><span className="preview-only-tag">SYNTHETIC DATA</span></div>;
}

export function WalletDemoPreview() {
  const [view, setView] = useState<View>("overview");
  const [scenario, setScenario] = useState<Scenario>("active");
  const [showScenario, setShowScenario] = useState(false);
  const pageTitle = view === "request" ? "Get a document" : view === "document" ? "Certificate preview" : view === "documents" ? "My documents" : "Overview";

  function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowScenario(true);
  }

  return <div className="wallet-shell">
    <aside className="wallet-sidebar">
      <Brand />
      <div className="wallet-side-label">WORKSPACE</div>
      <nav className="wallet-side-nav" aria-label="Main navigation">
        <button className={`wallet-nav-item ${view === "overview" ? "selected" : ""}`} onClick={() => setView("overview")}><Icon name="grid"/> Overview</button>
        <button className={`wallet-nav-item ${view === "documents" || view === "document" ? "selected" : ""}`} onClick={() => setView("documents")}><Icon name="file"/> My documents <span className="nav-count">0</span></button>
      </nav>
      <button className="sidebar-request" onClick={() => { setShowScenario(false); setView("request"); }}><Icon name="plus"/> Get a document <span>+</span></button>
      <div className="wallet-sidebar-bottom">
        <div className="secure-card"><span className="secure-icon"><Icon name="shield" size={16}/></span><div><strong>Private by design</strong><p>Only the authenticated owner will access a real wallet.</p></div></div>
        <div className="preview-profile"><span className="avatar">D</span><span className="profile-copy"><strong>Demo preview</strong><small>Not signed in</small></span><span className="profile-more">···</span></div>
      </div>
    </aside>

    <main className="wallet-main">
      <header className="wallet-topbar"><div className="wallet-breadcrumb">Workspace <span>/</span> <strong>{pageTitle}</strong></div><div className="wallet-top-actions"><span className="demo-pill"><i/> UI preview</span><Link className="top-signin" href="/signin">Sign in <Icon name="arrow" size={13}/></Link></div></header>
      <div className="wallet-page-content">
        {view !== "overview" && <PreviewBanner />}
        {view === "overview" && <>
          <section className="wallet-welcome"><div><div className="eyebrow">YOUR PERSONAL DOCUMENT WALLET</div><h1>Your documents, together<span className="period">.</span></h1><p className="welcome-sub">A simple place to retrieve and keep your school certificates.</p></div><div className="welcome-orb"><Icon name="file" size={24}/></div></section>
          <section className="documents-section"><div className="section-head"><div><h2>My documents <span className="nav-count">0</span></h2><p>Your retrieved certificates will appear here.</p></div><button className="primary-button" onClick={() => { setShowScenario(false); setView("request"); }}><Icon name="plus" size={15}/> Get a document <Icon name="arrow" size={13}/></button></div>
            <article className="wallet-empty-state"><div className="empty-art"><div className="art-shadow"/><div className="art-sheet back-sheet"/><div className="art-sheet main-sheet"><span className="art-seal"><Icon name="file" size={14}/></span><i/><i/><i/><b/></div><div className="art-plus"><Icon name="plus" size={16}/></div></div><div className="empty-copy"><span className="empty-kicker">YOUR WALLET IS EMPTY</span><h2>Keep your certificates in one place</h2><p>Retrieve an existing school certificate from our simulated issuer. We’ll check it before adding it to your wallet.</p><button className="secondary-button" onClick={() => { setShowScenario(false); setView("request"); }}>How it works <Icon name="chevron" size={14}/></button></div></article>
          </section>
        </>}

        {view === "documents" && <section className="wallet-screen"><div className="wallet-screen-heading"><div><div className="eyebrow">YOUR PRIVATE COLLECTION</div><h1>My documents</h1><p>Certificates appear here after a successful, authorized retrieval.</p></div><button className="primary-button" onClick={() => { setShowScenario(false); setView("request"); }}><Icon name="plus" size={15}/> Get a document</button></div>
          <div className="wallet-empty-state"><div className="empty-art"><div className="art-shadow"/><div className="art-sheet back-sheet"/><div className="art-sheet main-sheet"><span className="art-seal"><Icon name="file" size={14}/></span><i/><i/><i/><b/></div><div className="art-plus"><Icon name="plus" size={16}/></div></div><div className="empty-copy"><span className="empty-kicker">NO SAVED DOCUMENTS</span><h2>Your wallet is waiting</h2><p>This preview does not retrieve or save a certificate. Use the sample request screen to explore the form and feedback states.</p><button className="secondary-button" onClick={() => setView("request")}>Open request preview <Icon name="chevron" size={14}/></button></div></div>
        </section>}

        {view === "request" && <section className="wallet-screen"><div className="wallet-screen-heading"><div><button className="back-button" onClick={() => setView("overview")}><Icon name="back" size={15}/> Overview</button><div className="eyebrow">SIMULATED SCHOOL ISSUER</div><h1>Get a document</h1><p>Enter one of the clearly synthetic fixture combinations.</p></div><span className="request-step-count">STEP 1 <span>OF 1</span></span></div>
          <div className="request-layout"><form className="request-form-card" onSubmit={handleRequest}><div className="request-card-heading"><span className="request-card-icon"><Icon name="file" size={18}/></span><div><h2>Find a school certificate</h2><p>All values below are fictional test data.</p></div></div>
            <label className="request-field">Education level<select defaultValue="secondary"><option value="secondary">Secondary school certificate</option><option value="higher_secondary">Higher secondary certificate</option></select></label>
            <div className="request-field-grid"><label className="request-field">Student name<input defaultValue="Aarav Sample" autoComplete="off"/></label><label className="request-field">Seat number<input defaultValue="DEMO-25001" autoComplete="off"/></label></div>
            <label className="request-field request-year">Examination year<input defaultValue="2025" inputMode="numeric"/></label>
            <div className="request-hint"><Icon name="shield" size={15}/><p>Matching these fields only finds a synthetic fixture; it does not verify a real person’s identity.</p></div>
            <label className="request-field scenario-field">Preview a response state<select value={scenario} onChange={(event) => { setScenario(event.target.value as Scenario); setShowScenario(false); }}><option value="active">Active fixture (not verified)</option><option value="no_match">No matching record</option><option value="signature_invalid">Invalid issuer signature</option><option value="revoked">Revoked certificate</option><option value="superseded">Superseded certificate</option><option value="issuer_unavailable">Issuer unavailable</option></select></label>
            <button className="primary-button request-submit" type="submit">Show UI response <Icon name="arrow" size={14}/></button>
            <p className="request-disclaimer">This button only changes the preview. It does not send data to the issuer.</p>
          </form>
          <aside className="request-progress-card"><span className="request-progress-label">REQUEST PROGRESS</span><div className="request-progress-line"><i/></div><ol><li className="current"><span>1</span><div><strong>Find record</strong><small>UI state preview</small></div></li><li><span>2</span><div><strong>Verify issuer signature</strong><small>Not run</small></div></li><li><span>3</span><div><strong>Check current status</strong><small>Not run</small></div></li><li><span>4</span><div><strong>Save to wallet</strong><small>Not run</small></div></li></ol>
            {showScenario && <div className={`scenario-result ${scenarios[scenario].tone}`} role="status" aria-live="polite"><strong>{scenarios[scenario].label}</strong><p>{scenarios[scenario].message}</p><small>Preview response · no server checks performed</small></div>}
          </aside></div>
        </section>}

        {view === "document" && <section className="wallet-screen"><div className="wallet-screen-heading"><div><button className="back-button" onClick={() => setView("overview")}><Icon name="back" size={15}/> Overview</button><div className="eyebrow">DOCUMENT DETAILS · SAMPLE</div><h1>Certificate preview</h1><p>Fictional fixture · not retrieved or stored</p></div><span className="sample-record-chip">PREVIEW ONLY</span></div>
          <div className="document-layout"><article className="certificate-preview-card"><div className="certificate-paper"><div className="certificate-topline">EXAMPLE SCHOOL BOARD <span>SIMULATED</span></div><div className="certificate-seal"><Icon name="shield" size={19}/></div><span className="certificate-eyebrow">SYNTHETIC TEST CERTIFICATE</span><h2>School Certificate</h2><p>This sample record belongs to</p><strong className="certificate-name">Aarav Sample</strong><div className="certificate-data"><span><small>EDUCATION LEVEL</small><b>Secondary</b></span><span><small>EXAMINATION YEAR</small><b>2025</b></span><span><small>SEAT NUMBER</small><b>DEMO-25001</b></span></div><div className="certificate-watermark">DEMO ONLY · NOT OFFICIAL</div><p className="certificate-footnote">Fictional fixture for interface preview. This is not an issued or legally authoritative certificate.</p></div></article>
            <aside className="verification-panel"><div className="verification-panel-title"><span className="stat-icon lavender"><Icon name="shield" size={16}/></span><div><h2>Verification checks</h2><p>All checks are pending in this preview.</p></div></div><VerificationRow title="File integrity" detail="SHA-256 digest comparison"/><VerificationRow title="Issuer signature" detail="Trusted key signature check"/><VerificationRow title="Current status" detail="Live simulated issuer check"/><div className="display-blocked"><Icon name="lock" size={15}/><span>Document display is unavailable until every required check succeeds.</span></div><button className="disabled-download" disabled><Icon name="file" size={15}/> Download unavailable</button><p className="status-time">No current-status check has been performed.</p></aside></div>
        </section>}
        <footer className="wallet-footer"><span>Independent demonstration · Synthetic fixtures only</span><Link href="/signin">Sign in to your account <Icon name="arrow" size={12}/></Link></footer>
      </div>
    </main>
  </div>;
}

function VerificationRow({ title, detail }: { title: string; detail: string }) {
  return <div className="verification-row"><span className="verification-pending"><Icon name="clock" size={14}/></span><div><strong>{title}</strong><small>{detail}</small></div><span className="not-run">Not run</span></div>;
}
