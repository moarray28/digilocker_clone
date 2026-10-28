import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { safeReturnTo } from "@/lib/safe-return-to";
import { AuthForm } from "@/components/auth-form";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const returnTo = safeReturnTo((await searchParams).next);
  if (await auth.api.getSession({ headers: await headers() })) redirect(returnTo);
  const suffix = returnTo === "/" ? "" : `?next=${encodeURIComponent(returnTo)}`;
  return <main className="signin-page">
    <Link className="brand signin-brand" href="/"><span className="brand-mark">▤</span><span>certi<span className="brand-light">wallet</span></span></Link>
    <section className="signin-card">
      <span className="signin-symbol">✦</span>
      <span className="empty-kicker">DEMO ACCOUNT</span>
      <h1>Create your account</h1>
      <p>Use an email and password to create a demo wallet. Only synthetic data belongs here.</p>
      <AuthForm mode="sign-up" returnTo={returnTo} />
      <div className="signin-note">Use a password you do not use for any other account. Passwords are hashed before storage.</div>
      <p className="auth-switch">Already registered? <Link href={`/signin${suffix}`}>Sign in</Link></p>
    </section>
    <p className="signin-legal">Independent demonstration · Not affiliated with DigiLocker or a government agency.</p>
  </main>;
}
