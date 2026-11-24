"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { flatten, resetSchema, type FieldErrors } from "@/lib/validation";
import { Alert } from "./AuthShell";
import { PasswordField } from "./Field";

export function ResetForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const parsed = resetSchema.safeParse({ password: fd.get("password"), confirmPassword: fd.get("confirmPassword") });
    if (!parsed.success) return setErrors(flatten(parsed.error));
    setErrors({});
    setLoading(true);
    try {
      const { error } = await createClient().auth.updateUser({ password: parsed.data.password });
      if (error) return setFormError(error.message);
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setFormError("We could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <Alert kind="error">{formError}</Alert>}
      <PasswordField label="New password" name="password" autoComplete="new-password" error={errors.password} />
      <PasswordField label="Confirm new password" name="confirmPassword" autoComplete="new-password" error={errors.confirmPassword} />
      <button type="submit" disabled={loading} className="btn-primary">
        {loading && <Loader2 size={16} className="animate-spin" />} Update password
      </button>
    </form>
  );
}
