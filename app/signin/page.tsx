import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignInPage() {
  return <main className="signin-page">
    <Link className="brand signin-brand" href="/"><span className="brand-mark">▤</span><span>certi<span className="brand-light">wallet</span></span></Link>
    <section className="signin-card">
      <span className="signin-symbol">✦</span>
      <span className="empty-kicker">WELCOME TO YOUR WALLET</span>
      <h1>Sign in to continue</h1>
      <p>Sign in with your email and password to access your document wallet.</p>
      <AuthForm mode="sign-in" />
      <div className="signin-note">Demo accounts use synthetic test data. Your password is securely hashed and never stored in plain text.</div>
      <p className="auth-switch">New to the demo? <Link href="/signup">Create an account</Link></p>
    </section>
    <p className="signin-legal">Independent demonstration · Not affiliated with DigiLocker or a government agency.</p>
  </main>;
}
