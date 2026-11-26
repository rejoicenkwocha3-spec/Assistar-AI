import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell, Alert } from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/server";
import { ORG_COOKIE } from "@/lib/context";
import { Submit } from "@/components/dashboard/ActionForm";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error } = await searchParams;
  if (!/^[a-f0-9]{64}$/.test(token)) redirect("/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const next = encodeURIComponent(`/invite/${token}`);

  async function accept() {
    "use server";
    const sb = await createClient();
    const { data, error: e } = await sb.rpc("assistar_accept_invitation", { invite_token: token });
    if (e || !data) redirect(`/invite/${token}?error=${encodeURIComponent(e?.message ?? "Could not accept the invitation.")}`);
    (await cookies()).set(ORG_COOKIE, data as string, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 365 });
    redirect("/dashboard");
  }

  return (
    <AuthShell title="Join a workspace" subtitle="You have been invited to collaborate on Assistar AI.">
      {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}
      {user ? (
        <form action={accept} className="space-y-4"><p className="text-sm text-ink-muted">Signed in as <strong className="text-ink">{user.email}</strong>. The invitation only works for the email it was sent to.</p><Submit className="btn-primary">Accept invitation</Submit></form>
      ) : (
        <div className="space-y-3"><p className="text-sm text-ink-muted">Sign in or create an account with the email address that received this invitation.</p>
          <Link href={`/login?next=${next}`} className="btn-primary">Sign in</Link><Link href={`/signup?next=${next}`} className="btn-secondary w-full">Create an account</Link></div>
      )}
    </AuthShell>
  );
}
