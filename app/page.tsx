import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth-form";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return <main className="landing-page">
    <header className="landing-nav">
      <Link className="brand landing-brand" href="/" aria-label="CertiWallet home"><span className="brand-mark">▤</span><span>certi<span className="brand-light">wallet</span></span></Link>
      <nav className="landing-actions" aria-label="Account navigation">
        {session ? <>
          <span className="landing-session"><i /> Signed in as <strong>{session.user.email}</strong></span>
          <Link className="landing-button landing-button-primary" href="/wallet">Open wallet <span aria-hidden="true">↗</span></Link>
          <SignOutButton />
        </> : <>
          <Link className="landing-signin" href="/signin">Sign in</Link>
          <Link className="landing-button landing-button-primary" href="/signup">Create demo account <span aria-hidden="true">↗</span></Link>
        </>}
      </nav>
    </header>

    <section className="landing-hero">
      <div className="landing-copy">
        <span className="landing-eyebrow"><i /> A DIGITAL DOCUMENT WALLET DEMO</span>
        <h1>Your important documents,<br/><em>all in one place.</em></h1>
        <p>Explore a simple way to retrieve and keep school certificates in a personal wallet. This independent demo uses synthetic issuer data.</p>
        <div className="landing-hero-actions">
          {session ? <Link className="landing-button landing-button-primary landing-hero-cta" href="/wallet">Go to my wallet <span aria-hidden="true">↗</span></Link> : <>
            <Link className="landing-button landing-button-primary landing-hero-cta" href="/signup">Create a demo wallet <span aria-hidden="true">↗</span></Link>
            <Link className="landing-secondary-link" href="/signin">I already have an account</Link>
          </>}
        </div>
        <div className="landing-trust-note"><span aria-hidden="true">◇</span> Fictional test records only · No government connection</div>
      </div>
      <div className="landing-art" aria-label="Illustration of a sample certificate in a digital wallet" role="img">
        <div className="landing-art-glow" />
        <div className="landing-art-card landing-art-card-back"><i/><i/><i/></div>
        <div className="landing-art-card landing-art-certificate"><span className="landing-certificate-top">SCHOOL BOARD <b>DEMO</b></span><span className="landing-certificate-seal">✳</span><small>SYNTHETIC SAMPLE</small><strong>School Certificate</strong><i/><i/><i/><span className="landing-certificate-stamp">NOT OFFICIAL</span></div>
        <div className="landing-art-status"><span>✓</span><div><strong>Private wallet</strong><small>Sample interface</small></div></div>
        <span className="landing-art-spark landing-spark-one">✦</span><span className="landing-art-spark landing-spark-two">✧</span>
      </div>
    </section>

    <section className="landing-features" aria-label="Demo features">
      <article><span className="landing-feature-icon">▤</span><div><strong>One personal wallet</strong><p>Keep retrieved certificate copies together.</p></div></article>
      <article><span className="landing-feature-icon">✓</span><div><strong>Clear verification steps</strong><p>See integrity, signature, and status checks.</p></div></article>
      <article><span className="landing-feature-icon">◇</span><div><strong>Built for safe demos</strong><p>Explore with fictional records and accounts.</p></div></article>
    </section>
    <footer className="landing-footer"><span>CertiWallet · Independent demonstration</span><span>Not affiliated with DigiLocker or a government agency.</span></footer>
  </main>;
}
