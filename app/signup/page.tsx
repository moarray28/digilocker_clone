import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignUpPage() {
  return <main className="signin-page">
    <Link className="brand signin-brand" href="/"><span className="brand-mark">▤</span><span>certi<span className="brand-light">wallet</span></span></Link>
    <section className="signin-card">
      <span className="signin-symbol">✦</span>
      <span className="empty-kicker">DEMO ACCOUNT</span>
      <h1>Create your account</h1>
      <p>Use an email and password to create a demo wallet. Only synthetic data belongs here.</p>
      <AuthForm mode="sign-up" />
      <div className="signin-note">Use a password you do not use for any other account. Passwords are hashed before storage.</div>
      <p className="auth-switch">Already registered? <Link href="/signin">Sign in</Link></p>
    </section>
    <p className="signin-legal">Independent demonstration · Not affiliated with DigiLocker or a government agency.</p>
  </main>;
}
