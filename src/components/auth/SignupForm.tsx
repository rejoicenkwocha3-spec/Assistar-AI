"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { flatten, safeNext, signupSchema, type FieldErrors } from "@/lib/validation";
import { Alert } from "./AuthShell";
import { Field, PasswordField } from "./Field";

export function SignupForm({ next }: { next?: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      fullName: fd.get("fullName"), email: fd.get("email"),
      password: fd.get("password"), confirmPassword: fd.get("confirmPassword"),
      terms: fd.get("terms") === "on",
    });
    if (!parsed.success) return setErrors(flatten(parsed.error));
    setErrors({});
    setLoading(true);
    try {
      const { data, error } = await createClient().auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: { full_name: parsed.data.fullName, app: "assistar" },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext(next, "/onboarding"))}`,
        },
      });
      if (error) {
        setFormError(/already registered/i.test(error.message)
          ? "An account with this email already exists. Log in instead."
          : error.message);
        return;
      }
      // Email already registered and confirmation is on: Supabase returns no identities.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setFormError("An account with this email already exists. Log in instead.");
        return;
      }
      if (data.session) {
        router.replace(safeNext(next, "/onboarding"));
        router.refresh();
      } else {
        setSentTo(parsed.data.email);
      }
    } catch {
      setFormError("We could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto text-success" size={40} />
        <h2 className="text-lg font-bold text-forest">Check your email</h2>
        <p className="text-sm text-ink-muted">
          We sent a verification link to <strong className="text-ink">{sentTo}</strong>. Open it to activate your account and continue to onboarding.
        </p>
        <Link href="/login" className="btn-secondary w-full">Back to log in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && (
        <Alert kind="error">
          {formError} {formError.includes("Log in") && <Link href="/login" className="font-semibold underline">Go to log in</Link>}
        </Alert>
      )}
      <Field label="Full name" name="fullName" autoComplete="name" placeholder="Jane Doe" error={errors.fullName} />
      <Field label="Work email" name="email" type="email" autoComplete="email" placeholder="you@company.com" error={errors.email} />
      <PasswordField label="Password" name="password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password} />
      <PasswordField label="Confirm password" name="confirmPassword" autoComplete="new-password" placeholder="Repeat your password" error={errors.confirmPassword} />
      <div>
        <label className="flex items-start gap-2.5 text-sm text-ink">
          <input type="checkbox" name="terms" className="mt-0.5 h-4 w-4 rounded border-line accent-forest" />
          <span>I agree to the Terms of Service and Privacy Policy.</span>
        </label>
        {errors.terms && <p className="field-error">{errors.terms}</p>}
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading && <Loader2 size={16} className="animate-spin" />} {loading ? "Creating account" : "Create account"}
      </button>
    </form>
  );
}
