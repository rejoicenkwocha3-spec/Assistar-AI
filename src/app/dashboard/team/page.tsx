import { headers } from "next/headers";
import { getContext, isAdmin } from "@/lib/context";
import { Badge, Card, Page, PageHeader, timeAgo } from "@/components/dashboard/ui";
import { ActionForm, MiniForm, Submit } from "@/components/dashboard/ActionForm";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { changeRole, inviteMember, removeMember, revokeInvite } from "./actions";

export default async function TeamPage() {
  const { supabase, orgId, role, user } = await getContext();
  const admin = isAdmin(role);
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const [{ data: members }, invites, audit, assigned, replies] = await Promise.all([
    supabase.rpc("assistar_org_members", { org: orgId }),
    admin ? supabase.from("assistar_invitations").select("id, email, role, token, created_at").eq("organization_id", orgId).eq("status", "pending") : Promise.resolve({ data: [] }),
    admin ? supabase.from("assistar_audit_logs").select("id, action, meta, created_at, user_id").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(12) : Promise.resolve({ data: [] }),
    supabase.from("assistar_conversations").select("assigned_to, status").eq("organization_id", orgId).not("assigned_to", "is", null),
    supabase.from("assistar_messages").select("author_id").eq("organization_id", orgId).eq("role", "human").gte("created_at", since).limit(5000),
  ]);
  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const list = (members ?? []) as { user_id: string; role: string; full_name: string | null; email: string | null; joined_at: string }[];
  const nameOf = (id: string | null) => list.find((m) => m.user_id === id)?.full_name || list.find((m) => m.user_id === id)?.email || "System";
  const stat = (id: string) => ({ open: (assigned.data ?? []).filter((c) => c.assigned_to === id && c.status !== "resolved").length, replies: (replies.data ?? []).filter((m) => m.author_id === id).length });

  return (
    <Page>
      <PageHeader title="Team" description="Invite colleagues, set what they can do, and see who is handling conversations." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-0"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-5 py-3">Member</th><th className="px-3 py-3">Role</th><th className="px-3 py-3 text-right">Open assigned</th><th className="px-3 py-3 text-right">Replies, 30d</th><th className="px-5 py-3" /></tr></thead>
            <tbody className="divide-y divide-line">{list.map((m) => { const s = stat(m.user_id); return (
              <tr key={m.user_id}><td className="px-5 py-3"><span className="font-medium">{m.full_name || m.email}</span>{m.user_id === user.id && <span className="ml-1 text-xs text-ink-muted">(you)</span>}<span className="block text-xs text-ink-muted">{m.email}</span></td>
                <td className="px-3 py-3">{admin && m.role !== "owner" ? (
                  <form action={changeRole} className="flex gap-1"><input type="hidden" name="userId" value={m.user_id} /><select name="role" defaultValue={m.role} className="input w-28 py-1.5 text-xs" aria-label={`Role for ${m.full_name || m.email}`}><option value="admin">Admin</option><option value="manager">Manager</option><option value="agent">Agent</option></select><Submit className="btn-secondary py-1.5 text-xs">Save</Submit></form>
                ) : <Badge value={m.role === "owner" ? "active" : "draft"} />}{m.role === "owner" && <span className="ml-2 text-xs font-semibold">Owner</span>}</td>
                <td className="px-3 py-3 text-right">{s.open}</td><td className="px-3 py-3 text-right">{s.replies}</td>
                <td className="px-5 py-3 text-right">{admin && m.role !== "owner" && m.user_id !== user.id && <MiniForm action={removeMember} fields={{ userId: m.user_id }} confirm={`Remove ${m.full_name || m.email} from this workspace?`} className="text-xs text-red-700 underline">Remove</MiniForm>}</td></tr>); })}</tbody></table></div></Card>
          <Card><h2 className="mb-2 font-bold text-forest">What each role can do</h2>
            <ul className="space-y-1 text-sm text-ink-muted"><li><strong className="text-ink">Owner and Admin:</strong> everything, including team, integrations, billing visibility and audit logs.</li><li><strong className="text-ink">Manager:</strong> build and publish agents, manage knowledge, widgets, actions and tests.</li><li><strong className="text-ink">Agent:</strong> work the inbox: reply, assign, add notes, escalate and resolve.</li></ul></Card>
          {admin && <Card><h2 className="mb-3 font-bold text-forest">Activity history</h2>{!audit.data?.length ? <p className="text-sm text-ink-muted">No activity yet.</p> : <ul className="space-y-2 text-sm">{audit.data.map((a) => <li key={a.id} className="flex justify-between gap-3"><span><strong>{nameOf(a.user_id)}</strong> <code className="text-xs">{a.action}</code></span><span className="shrink-0 text-xs text-ink-muted">{timeAgo(a.created_at)}</span></li>)}</ul>}</Card>}
        </div>
        <div className="space-y-6">
          {admin ? <Card><h2 className="mb-3 font-bold text-forest">Invite a team member</h2>
            <ActionForm action={inviteMember} resetOnSuccess><div className="space-y-3"><div><label className="label" htmlFor="ie">Work email</label><input id="ie" name="email" type="email" className="input" /></div>
              <div><label className="label" htmlFor="ir">Role</label><select id="ir" name="role" defaultValue="agent" className="input"><option value="agent">Agent</option><option value="manager">Manager</option><option value="admin">Admin</option></select></div>
              <Submit className="btn-primary">Create invitation</Submit></div></ActionForm>
            <p className="mt-3 text-xs text-ink-muted">Assistar AI does not email invitations yet. Copy the link and send it yourself.</p></Card> : <Card><p className="text-sm text-ink-muted">Only owners and admins can invite people.</p></Card>}
          {admin && !!invites.data?.length && <Card><h2 className="mb-3 font-bold text-forest">Pending invitations</h2><ul className="space-y-3">{invites.data.map((i) => (<li key={i.id} className="text-sm"><p className="font-medium">{i.email} <span className="text-xs text-ink-muted">({i.role})</span></p><div className="mt-1 flex gap-2"><CopyButton text={`${origin}/invite/${i.token}`} label="Copy link" /><MiniForm action={revokeInvite} fields={{ id: i.id }}>Revoke</MiniForm></div></li>))}</ul></Card>}
        </div>
      </div>
    </Page>
  );
}
