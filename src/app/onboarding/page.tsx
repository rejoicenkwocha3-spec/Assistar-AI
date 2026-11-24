import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export default async function Onboarding() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");
  const { data: org } = await supabase.from("organizations").select("name").limit(1).maybeSingle();
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold text-navy">Welcome to Onboard AI</h1>
      <p className="mt-2 text-muted">Your workspace {org ? `"${org.name}" ` : ""}is ready. The guided organization setup comes next.</p>
      <a href="/dashboard" className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 font-semibold text-white">Continue to dashboard</a>
    </main>
  );
}
