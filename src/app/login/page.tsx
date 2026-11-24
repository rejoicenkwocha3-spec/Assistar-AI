"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, flatten } from "@/lib/validation";
import { safeNext } from "@/lib/safe-next";
import { AuthShell, Field, PasswordField, Notice, SubmitButton, friendlyAuthError } from "@/components/auth-ui";

function Form() {
  const router = useRouter(); const params = useSearchParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState(""); const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg("");
    const f = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({ email: f.get("email"), password: f.get("password") });
    if (!parsed.success) return setErrors(flatten(parsed.error));
    setErrors({}); setLoading(true);
    const { error } = await createClient().auth.signInWithPassword(parsed.data);
    if (error) { setLoading(false); return setMsg(friendlyAuthError(error.message)); }
    router.replace(safeNext(params.get("next"))); router.refresh();
  }
  return (
    <AuthShell title="Welcome back" subtitle="Log in to your Onboard AI workspace.">
      {params.get("verified") && <Notice kind="success">Email verified. You can log in now.</Notice>}
      {params.get("reset") && <Notice kind="success">Password updated. Log in with your new password.</Notice>}
      {params.get("error") && <Notice kind="error">That link is invalid or has expired. Please try again.</Notice>}
      {msg && <Notice kind="error">{msg}</Notice>}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Work email" name="email" type="email" autoComplete="email" error={errors.email} />
        <PasswordField label="Password" name="password" autoComplete="current-password" error={errors.password} />
        <div className="text-right text-sm"><Link href="/forgot-password" className="text-brand">Forgot password?</Link></div>
        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New to Onboard AI? <Link href="/signup" className="font-semibold text-brand">Create an account</Link></p>
    </AuthShell>
  );
}
export default function LoginPage() { return <Suspense><Form /></Suspense>; }
