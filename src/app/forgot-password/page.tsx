"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { emailSchema } from "@/lib/validation";
import { AuthShell, Field, Notice, SubmitButton, friendlyAuthError } from "@/components/auth-ui";

export default function ForgotPassword() {
  const [err, setErr] = useState(""); const [done, setDone] = useState(false); const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr("");
    const parsed = emailSchema.safeParse(new FormData(e.currentTarget).get("email"));
    if (!parsed.success) return setErr(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) return setErr(friendlyAuthError(error.message));
    setDone(true);
  }
  return (
    <AuthShell title="Reset your password" subtitle="We will email you a link to choose a new one.">
      {done ? <Notice kind="success">If an account exists for that email, a reset link is on its way.</Notice> : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {err && <Notice kind="error">{err}</Notice>}
          <Field label="Work email" name="email" type="email" autoComplete="email" />
          <SubmitButton loading={loading}>Send reset link</SubmitButton>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-brand">Back to log in</Link></p>
    </AuthShell>
  );
}
