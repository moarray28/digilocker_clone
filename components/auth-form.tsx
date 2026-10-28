"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const isSignUp = mode === "sign-up";

  async function submit(formData: FormData) {
    setBusy(true);
    setMessage("");
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    const result = isSignUp
      ? await authClient.signUp.email({ name, email, password, callbackURL: "/wallet" })
      : await authClient.signIn.email({ email, password, callbackURL: "/wallet" });

    setBusy(false);
    if (result.error) {
      setMessage(result.error.message ?? "Unable to authenticate. Check your details and try again.");
      return;
    }
    router.push("/wallet");
    router.refresh();
  }

  return <form className="auth-form" action={submit}>
    {isSignUp && <label>Your name<input autoComplete="name" name="name" required maxLength={100} /></label>}
    <label>Email address<input autoComplete="email" name="email" type="email" required maxLength={254} /></label>
    <label>Password<input autoComplete={isSignUp ? "new-password" : "current-password"} name="password" type="password" minLength={8} maxLength={128} required /></label>
    {message && <p className="auth-error" role="alert">{message}</p>}
    <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : isSignUp ? "Create demo account" : "Sign in"}<span className="button-arrow">↗</span></button>
  </form>;
}

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    await authClient.signOut();
    router.push("/signin");
    router.refresh();
  }
  return <button className="signout-button" type="button" disabled={busy} onClick={signOut}>{busy ? "Signing out…" : "Sign out"}</button>;
}

