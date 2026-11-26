"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { flatten, loginSchema, safeNext, type FieldErrors } from "@/lib/validation";
import { Alert } from "./AuthShell";
import { Field, PasswordField } from "./Field";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null); setUnconfirmed(null); setResent(false);
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) return setErrors(flatten(parsed.error));
    setErrors({});
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) {
        if (/not confirmed/i.test(error.message)) {
          setUnconfirmed(parsed.data.email);
          setFormError("Your email address has not been verified yet. Check your inbox for the verification link.");
        } else if (/invalid login/i.test(error.message)) {
          setFormError("Incorrect email or password.");
        } else {
          setFormError(error.message);
        }
        return;
      }
      router.replace(safeNext(next));
      router.refresh();
    } catch {
      setFormError("We could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!unconfirmed) return;
    const { error } = await createClient().auth.resend({
      type: "signup", email: unconfirmed,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    if (error) setFormError(error.message); else setResent(true);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {notice && <Alert kind="info">{notice}</Alert>}
      {formError && <Alert kind="error">{formError}</Alert>}
      {unconfirmed && !resent && (
        <button type="button" onClick={resend} className="text-sm font-semibold text-forest underline">Resend verification email</button>
      )}
      {resent && <Alert kind="success">Verification email sent. Check your inbox.</Alert>}
      <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" error={errors.email} />
      <div>
        <PasswordField label="Password" name="password" autoComplete="current-password" placeholder="Your password" error={errors.password} />
        <div className="mt-2 text-right">
          <Link href="/forgot-password" className="text-sm font-medium text-forest hover:underline">Forgot password?</Link>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading && <Loader2 size={16} className="animate-spin" />} {loading ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
