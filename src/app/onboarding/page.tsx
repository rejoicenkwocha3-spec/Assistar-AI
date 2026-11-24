import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");
  const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", user.id).single();
  if (profile?.onboarded) redirect("/dashboard");
  return (
    <AuthShell title="Set up your business" subtitle="Tell us about your business so we can tailor your workspace.">
      <OnboardingForm />
    </AuthShell>
  );
}
