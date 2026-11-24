"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, flatten } from "@/lib/validation";
import { AuthShell, Field, PasswordField, Notice, SubmitButton, friendlyAuthError } from "@/components/auth-ui";

export default function SignupPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState(""); const [sentTo, setSentTo] = useState(""); const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg("");
    const f = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      fullName: f.get("fullName"), email: f.get("email"), password: f.get("password"),
      confirm: f.get("confirm"), terms: f.get("terms") === "on",
    });
    if (!parsed.success) return setErrors(flatten(parsed.error));
    setErrors({}); setLoading(true);
    const { data, error } = await createClient().auth.signUp({
      email: parsed.data.email, password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    setLoading(false);
    if (error) return setMsg(friendlyAuthError(error.message));
    // Supabase returns a user with no identities when the email already exists (anti-enumeration).
    if (data.user && data.user.identities?.length === 0) return setMsg("An account with this email already exists. Try logging in.");
    if (data.session) { router.replace("/onboarding"); router.refresh(); }
    else setSentTo(parsed.data.email);
  }

  if (sentTo) return (
    <AuthShell title="Check your email" subtitle="One more step to activate your account.">
      <Notice kind="success">We sent a confirmation link to <strong>{sentTo}</strong>. Open it to continue to onboarding.</Notice>
      <Link href="/login" className="text-sm font-semibold text-brand">Back to log in</Link>
    </AuthShell>
  );

  return (
    <AuthShell title="Create your account" subtitle="Start hiring and onboarding with Onboard AI.">
      {msg && <Notice kind="error">{msg}</Notice>}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Full name" name="fullName" autoComplete="name" error={errors.fullName} />
        <Field label="Work email" name="email" type="email" autoComplete="email" error={errors.email} />
        <PasswordField label="Password" name="password" autoComplete="new-password" error={errors.password} />
        <PasswordField label="Confirm password" name="confirm" autoComplete="new-password" error={errors.confirm} />
        <div>
          <label className="flex items-start gap-2 text-sm text-muted">
            <input type="checkbox" name="terms" className="mt-1" /> I accept the Terms of Service and Privacy Policy.
          </label>
          {errors.terms && <span className="mt-1 block text-xs text-red-600">{errors.terms}</span>}
        </div>
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-brand">Log in</Link></p>
    </AuthShell>
  );
}
