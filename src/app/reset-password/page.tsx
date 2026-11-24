import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "@/components/auth/ResetForm";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=verify_failed");
  return (
    <AuthShell title="Choose a new password" subtitle="Use at least 8 characters with upper case, lower case, and a number.">
      <ResetForm />
    </AuthShell>
  );
}
