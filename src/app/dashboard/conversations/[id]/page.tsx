import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/lib/context";
import { Badge, Card, Page, PageHeader, timeAgo } from "@/components/dashboard/ui";
import { ActionForm, MiniForm, Submit } from "@/components/dashboard/ActionForm";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
import { addContext, addNote, assign, deleteContext, escalateConversation, replyToCustomer, resolveConversation, saveCustomer, setStatus } from "../actions";

const ROLE_STYLE: Record<string, string> = {
  customer: "bg-white border border-line", assistant: "bg-sage/25", human: "bg-forest text-white", note: "bg-amber-50 border border-amber-200", system: "bg-transparent text-ink-muted italic",
};
const ROLE_LABEL: Record<string, string> = { customer: "Customer", assistant: "AI assistant", human: "Team member", note: "Internal note", system: "" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, user } = await getContext();
  const { data: conv } = await supabase.from("assistar_conversations").select("*, assistar_agents(name), assistar_customers(id, name, email, phone, visitor_id)").eq("id", id).eq("organization_id", orgId).maybeSingle();
  if (!conv) notFound();
  const cust = conv.assistar_customers as unknown as { id: string; name: string | null; email: string | null; phone: string | null; visitor_id: string | null } | null;
  const agent = conv.assistar_agents as unknown as { name: string } | null;

  const [{ data: messages }, { data: members }, { data: handoffs }, { data: context }, { data: history }] = await Promise.all([
    supabase.from("assistar_messages").select("id, role, content, created_at, latency_ms, meta, author_id").eq("conversation_id", id).order("created_at"),
    supabase.rpc("assistar_org_members", { org: orgId }),
    supabase.from("assistar_handoffs").select("id, reason, requested_by, created_at, resolved_at, assigned_to").eq("conversation_id", id).order("created_at", { ascending: false }),
    cust ? supabase.from("assistar_customer_context").select("id, key, value").eq("customer_id", cust.id).order("created_at") : Promise.resolve({ data: [] }),
    cust ? supabase.from("assistar_conversations").select("id, subject, status, created_at").eq("customer_id", cust.id).neq("id", id).order("created_at", { ascending: false }).limit(5) : Promise.resolve({ data: [] }),
  ]);
  const nameOf = (uid: string | null) => (members ?? []).find((m: { user_id: string }) => m.user_id === uid);
  const assignee = nameOf(conv.assigned_to) as { full_name: string | null; email: string | null } | undefined;

  return (
    <Page>
      <AutoRefresh seconds={8} />
      <PageHeader title={conv.subject || "Conversation"} description={`${cust?.name || cust?.email || "Anonymous visitor"} via ${conv.channel}${agent ? ` · ${agent.name}` : ""} · started ${timeAgo(conv.created_at)}`}
        actions={<><Badge value={conv.status} /><Link href="/dashboard/conversations" className="btn-secondary py-1.5 text-xs">Back to inbox</Link></>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="space-y-3">
            {(messages ?? []).map((m) => (
              <div key={m.id} className={`flex ${m.role === "customer" ? "justify-start" : m.role === "system" ? "justify-center" : "justify-end"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${ROLE_STYLE[m.role]}`}>
                  {ROLE_LABEL[m.role] && <p className={`mb-0.5 text-[10px] font-semibold uppercase tracking-wide ${m.role === "human" ? "text-white/70" : "text-ink-muted"}`}>{ROLE_LABEL[m.role]}{m.role === "human" && m.author_id ? ` · ${(nameOf(m.author_id) as { full_name?: string } | undefined)?.full_name ?? ""}` : ""}</p>}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.role === "assistant" && (
                    <p className="mt-1 text-[11px] text-ink-muted">{(m.meta as { kb_hits?: number })?.kb_hits ? `Used: ${((m.meta as { sources?: string[] }).sources ?? []).join(", ")}` : "No knowledge matched"}{m.latency_ms ? ` · ${m.latency_ms} ms` : ""}</p>
                  )}
                  {m.role === "system" && (m.meta as { error?: string })?.error && <p className="text-[11px] text-red-700 not-italic">Error: {(m.meta as { error: string }).error}</p>}
                </div>
              </div>
            ))}
            {!messages?.length && <p className="text-sm text-ink-muted">No messages yet.</p>}
          </Card>
          <Card>
            <ActionForm action={replyToCustomer} resetOnSuccess><input type="hidden" name="id" value={id} />
              <label className="label" htmlFor="content">Reply to customer</label>
              <textarea id="content" name="content" rows={3} className="input" placeholder="Replying takes the conversation over from the assistant." maxLength={4000} />
              <div className="mt-3"><Submit className="btn-primary w-auto px-5">Send reply</Submit></div></ActionForm>
            <div className="mt-5 border-t border-line pt-4"><ActionForm action={addNote} resetOnSuccess><input type="hidden" name="id" value={id} />
              <label className="label" htmlFor="note">Internal note</label><textarea id="note" name="content" rows={2} className="input" placeholder="Visible to your team only" maxLength={4000} />
              <div className="mt-3"><Submit className="btn-secondary">Add note</Submit></div></ActionForm></div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card><h2 className="mb-3 font-bold text-forest">Manage</h2>
            <div className="flex flex-wrap gap-2">
              {conv.status !== "resolved" ? <MiniForm action={resolveConversation} fields={{ id }} className="btn-primary w-auto px-4 py-1.5 text-xs">Resolve and close</MiniForm> : <MiniForm action={setStatus} fields={{ id, status: "open" }}>Reopen</MiniForm>}
              {conv.status !== "pending" && conv.status !== "resolved" && <MiniForm action={setStatus} fields={{ id, status: "pending" }}>Mark pending</MiniForm>}
            </div>
            <form action={assign} className="mt-4 flex gap-2"><input type="hidden" name="id" value={id} />
              <select name="userId" defaultValue={conv.assigned_to ?? ""} className="input py-2 text-sm" aria-label="Assign to"><option value="">Unassigned</option>{(members ?? []).map((m: { user_id: string; full_name: string | null; email: string | null }) => <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}{m.user_id === user.id ? " (you)" : ""}</option>)}</select>
              <Submit className="btn-secondary">Assign</Submit></form>
            {assignee && <p className="mt-2 text-xs text-ink-muted">Assigned to {assignee.full_name || assignee.email}</p>}
            {conv.status !== "escalated" && conv.status !== "resolved" && (
              <form action={escalateConversation} className="mt-4 flex gap-2"><input type="hidden" name="id" value={id} /><input name="reason" className="input py-2 text-sm" placeholder="Reason for escalation" maxLength={300} /><Submit className="btn-secondary">Escalate</Submit></form>)}
          </Card>

          <Card><h2 className="mb-3 font-bold text-forest">Customer</h2>
            {cust ? <ActionForm action={saveCustomer}><input type="hidden" name="id" value={id} />
              <div className="space-y-3"><div><label className="label" htmlFor="cn">Name</label><input id="cn" name="name" defaultValue={cust.name ?? ""} className="input py-2" /></div>
                <div><label className="label" htmlFor="ce">Email</label><input id="ce" name="email" type="email" defaultValue={cust.email ?? ""} className="input py-2" /></div>
                <div><label className="label" htmlFor="cp">Phone</label><input id="cp" name="phone" defaultValue={cust.phone ?? ""} className="input py-2" /></div></div>
              <div className="mt-3"><Submit className="btn-secondary">Save customer</Submit></div></ActionForm> : <p className="text-sm text-ink-muted">No customer record.</p>}
          </Card>

          {cust && <Card><h2 className="mb-1 font-bold text-forest">Customer memory</h2><p className="mb-3 text-xs text-ink-muted">Facts the assistant may use in this customer&apos;s future replies, such as preferences or open issues.</p>
            <ul className="space-y-2">{(context ?? []).map((c: { id: string; key: string; value: string }) => (<li key={c.id} className="flex items-start justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-sm"><span><strong>{c.key}:</strong> {c.value}</span><MiniForm action={deleteContext} fields={{ id, ctxId: c.id }} className="text-xs text-red-700 underline">Remove</MiniForm></li>))}
              {!context?.length && <li className="text-sm text-ink-muted">Nothing stored yet.</li>}</ul>
            <ActionForm action={addContext} resetOnSuccess className="mt-3"><input type="hidden" name="id" value={id} />
              <div className="flex gap-2"><input name="key" placeholder="Label" className="input py-2 text-sm" maxLength={80} /><input name="value" placeholder="Value" className="input py-2 text-sm" maxLength={2000} /></div>
              <div className="mt-2"><Submit className="btn-secondary">Add</Submit></div></ActionForm></Card>}

          {!!handoffs?.length && <Card><h2 className="mb-3 font-bold text-forest">Handoff history</h2><ul className="space-y-3 text-sm">{handoffs.map((h) => (<li key={h.id}><p>{h.reason || "No reason given"}</p><p className="text-xs text-ink-muted">Requested by {h.requested_by} · {timeAgo(h.created_at)}{h.resolved_at ? " · resolved" : ""}</p></li>))}</ul>
            {conv.summary && <div className="mt-3 border-t border-line pt-3"><p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Summary for the team</p><p className="mt-1 whitespace-pre-wrap text-sm">{conv.summary}</p></div>}</Card>}

          {!!history?.length && <Card><h2 className="mb-3 font-bold text-forest">Previous conversations</h2><ul className="space-y-2 text-sm">{history.map((h: { id: string; subject: string; status: string; created_at: string }) => (<li key={h.id}><Link href={`/dashboard/conversations/${h.id}`} className="flex items-center justify-between gap-2 hover:underline"><span className="truncate">{h.subject || "No subject"}</span><Badge value={h.status} /></Link></li>))}</ul></Card>}
        </div>
      </div>
    </Page>
  );
}
