"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { flatten, forgotSchema, type FieldErrors } from "@/lib/validation";
import { Alert } from "./AuthShell";
import { Field } from "./Field";

export function ForgotForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const parsed = forgotSchema.safeParse({ email: new FormData(e.currentTarget).get("email") });
    if (!parsed.success) return setErrors(flatten(parsed.error));
    setErrors({});
    setLoading(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) setFormError(error.message); else setDone(true);
    } catch {
      setFormError("We could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) return <Alert kind="success">If an account exists for that email, a reset link is on its way.</Alert>;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <Alert kind="error">{formError}</Alert>}
      <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" error={errors.email} />
      <button type="submit" disabled={loading} className="btn-primary">
        {loading && <Loader2 size={16} className="animate-spin" />} Send reset link
      </button>
    </form>
  );
}
