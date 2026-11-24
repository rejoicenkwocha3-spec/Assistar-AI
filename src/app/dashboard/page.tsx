import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase.from("profiles").select("full_name, onboarded").eq("id", user.id).single();
  if (profile && !profile.onboarded) redirect("/onboarding");
  const { data: membership } = await supabase
    .from("organization_members").select("role, organizations(name)").eq("user_id", user.id).limit(1).single();
  const org = membership?.organizations as unknown as { name: string } | null;

  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <form action="/auth/signout" method="post">
            <button className="btn-secondary" type="submit"><LogOut size={16} /> Log out</button>
          </form>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-forest">
          Welcome, {profile?.full_name || user.email}
        </h1>
        <p className="mt-2 text-ink-muted">
          {org ? <>Workspace: <strong className="text-ink">{org.name}</strong> ({membership?.role})</> : "Your workspace is being prepared."}
        </p>
        <div className="mt-8 rounded-xl border border-line bg-white p-6 shadow-card">
          <p className="text-sm text-ink-muted">Your account is active. The agent builder and the rest of the dashboard modules are built in later phases.</p>
        </div>
      </section>
    </main>
  );
}
