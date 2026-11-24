"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { passwordSchema } from "@/lib/validation";
import { AuthShell, PasswordField, Notice, SubmitButton, friendlyAuthError } from "@/components/auth-ui";

export default function ResetPassword() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({}); const [msg, setMsg] = useState(""); const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg("");
    const f = new FormData(e.currentTarget);
    const p = passwordSchema.safeParse(f.get("password"));
    if (!p.success) return setErrors({ password: p.error.issues[0].message });
    if (f.get("password") !== f.get("confirm")) return setErrors({ confirm: "Passwords do not match." });
    setErrors({}); setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: p.data });
    if (error) { setLoading(false); return setMsg(friendlyAuthError(error.message)); }
    await supabase.auth.signOut();
    router.replace("/login?reset=1");
  }
  return (
    <AuthShell title="Choose a new password" subtitle="Use at least 8 characters with a letter and a number.">
      {msg && <Notice kind="error">{msg}</Notice>}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <PasswordField label="New password" name="password" autoComplete="new-password" error={errors.password} />
        <PasswordField label="Confirm password" name="confirm" autoComplete="new-password" error={errors.confirm} />
        <SubmitButton loading={loading}>Update password</SubmitButton>
      </form>
    </AuthShell>
  );
}
