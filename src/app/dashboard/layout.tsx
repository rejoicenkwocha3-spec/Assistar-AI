import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Logo } from "@/components/Logo";
import { loadContext } from "@/lib/context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await loadContext();

  if (!ctx.ok) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
        <Logo />
        <div className="mt-8 w-full max-w-lg rounded-2xl border border-line bg-white p-8 shadow-card">
          <h1 className="text-2xl font-extrabold tracking-tight text-forest">We could not open your workspace</h1>
          <p className="mt-3 text-sm text-ink-muted">You are signed in as <strong className="text-ink">{ctx.user.email}</strong>, but your workspace could not be loaded or created.</p>
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{ctx.detail}</p>
          <p className="mt-4 text-sm text-ink-muted">This usually means the database setup is incomplete. In the Supabase SQL Editor, run <code>0001_auth_foundation.sql</code> and then <code>0002_platform.sql</code>, then reload this page.</p>
          <div className="mt-6 flex gap-3">
            <a href="/dashboard" className="btn-primary w-auto px-5">Reload</a>
            <form action="/auth/signout" method="post"><button type="submit" className="btn-secondary">Sign out</button></form>
          </div>
        </div>
      </main>
    );
  }

  if (ctx.profile && !ctx.profile.onboarded) redirect("/onboarding");
  return (
    <Sidebar orgs={ctx.organizations} activeOrgId={ctx.orgId} userName={ctx.profile?.full_name || ctx.user.email || "Account"} role={ctx.role}>
      {children}
    </Sidebar>
  );
}
