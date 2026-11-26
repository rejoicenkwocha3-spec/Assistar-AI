import Link from "next/link";
import { getContext } from "@/lib/context";
import { Badge, Card, EmptyState, Page, PageHeader, timeAgo } from "@/components/dashboard/ui";

export default async function MonitoringPage() {
  const { supabase, orgId } = await getContext();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const dayAgo = new Date(Date.now() - 864e5).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();

  const [gapsRes, errsRes, slowRes, convsRes, handoffsRes, failedRes, pendingRes] = await Promise.all([
    supabase.from("assistar_messages").select("id, conversation_id, created_at").eq("organization_id", orgId).eq("role", "assistant").eq("meta->>kb_hits", "0").gte("created_at", since).order("created_at", { ascending: false }).limit(40),
    supabase.from("assistar_messages").select("id, conversation_id, created_at, meta").eq("organization_id", orgId).eq("role", "system").not("meta->>error", "is", null).gte("created_at", since).order("created_at", { ascending: false }).limit(15),
    supabase.from("assistar_messages").select("id, conversation_id, latency_ms, created_at").eq("organization_id", orgId).eq("role", "assistant").gt("latency_ms", 10000).gte("created_at", since).order("created_at", { ascending: false }).limit(10),
    supabase.from("assistar_conversations").select("id, subject, status, customer_id, created_at, last_message_at").eq("organization_id", orgId).gte("created_at", since).limit(2000),
    supabase.from("assistar_handoffs").select("id, reason, conversation_id, created_at").eq("organization_id", orgId).gte("created_at", since).limit(500),
    supabase.from("assistar_action_executions").select("id, error, created_at, assistar_actions(name)").eq("organization_id", orgId).eq("status", "failed").gte("created_at", since).order("created_at", { ascending: false }).limit(10),
    supabase.from("assistar_action_executions").select("id").eq("organization_id", orgId).eq("status", "pending_approval"),
  ]);

  // Knowledge gaps: the customer question that preceded each assistant reply with no matching knowledge.
  const gapMsgs = gapsRes.data ?? [];
  const gapConvIds = [...new Set(gapMsgs.map((g) => g.conversation_id))];
  const { data: custMsgs } = gapConvIds.length ? await supabase.from("assistar_messages").select("conversation_id, content, created_at").in("conversation_id", gapConvIds).eq("role", "customer").order("created_at") : { data: [] };
  const gaps = gapMsgs.map((g) => {
    const q = [...(custMsgs ?? [])].filter((m) => m.conversation_id === g.conversation_id && m.created_at <= g.created_at).pop();
    return { id: g.id, conversationId: g.conversation_id, question: q?.content ?? "", at: g.created_at };
  }).filter((g) => g.question);

  const convs = convsRes.data ?? [];
  const unsuccessful = convs.filter((c) => c.status === "escalated" || ((c.status === "open" || c.status === "pending") && c.last_message_at < dayAgo)).slice(0, 10);
  const byCustomer = convs.filter((c) => c.customer_id && c.status !== "resolved" && c.created_at >= weekAgo).reduce<Record<string, typeof convs>>((acc, c) => { (acc[c.customer_id!] ??= []).push(c); return acc; }, {});
  const repeated = Object.values(byCustomer).filter((v) => v.length >= 2);
  const reasons = Object.entries((handoffsRes.data ?? []).reduce<Record<string, number>>((acc, h) => { const k = (h.reason || "No reason given").slice(0, 80); acc[k] = (acc[k] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const recs: string[] = [];
  if (gaps.length) recs.push(`Add knowledge about: "${gaps[0].question.slice(0, 90)}". ${gaps.length} recent answer${gaps.length === 1 ? "" : "s"} had no matching knowledge.`);
  if (convs.length >= 5 && (handoffsRes.data?.length ?? 0) / convs.length > 0.3) recs.push("More than 30% of conversations are being handed to people. Review your escalation rules and add knowledge for the top handoff reasons.");
  if ((errsRes.data ?? []).length) recs.push("The assistant failed to reply in some conversations. Check the AI provider key and model name in Settings and Agent Studio.");
  if (repeated.length) recs.push(`${repeated.length} customer${repeated.length === 1 ? "" : "s"} opened repeated unresolved conversations this week. Review them first.`);
  if ((pendingRes.data ?? []).length) recs.push(`${pendingRes.data!.length} action request${pendingRes.data!.length === 1 ? " is" : "s are"} waiting for approval.`);
  if ((slowRes.data ?? []).length) recs.push("Some replies took more than 10 seconds. Consider a faster model for this agent.");

  const hasAnything = convs.length > 0;
  return (
    <Page>
      <PageHeader title="Monitoring" description="Where your assistants are falling short, based on the last 30 days of real conversations." />
      {!hasAnything ? <EmptyState title="Nothing to monitor yet" body="Monitoring starts when conversations arrive. Test chats in Agent Studio are not counted." /> : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2"><h2 className="mb-3 font-bold text-forest">Improvement recommendations</h2>
            {recs.length ? <ul className="list-disc space-y-2 pl-5 text-sm">{recs.map((r) => <li key={r}>{r}</li>)}</ul> : <p className="text-sm text-ink-muted">No issues detected. Recommendations appear when the data shows a problem.</p>}</Card>
          <Card><h2 className="mb-3 font-bold text-forest">Knowledge gaps</h2>
            {!gaps.length ? <p className="text-sm text-ink-muted">Every answer had matching knowledge.</p> : <ul className="divide-y divide-line">{gaps.slice(0, 8).map((g) => (<li key={g.id}><Link href={`/dashboard/conversations/${g.conversationId}`} className="block py-2.5 text-sm hover:bg-surface/60"><span className="line-clamp-2">{g.question}</span><span className="text-xs text-ink-muted">{timeAgo(g.at)}</span></Link></li>))}</ul>}</Card>
          <Card><h2 className="mb-3 font-bold text-forest">Unsuccessful conversations</h2>
            {!unsuccessful.length ? <p className="text-sm text-ink-muted">None right now.</p> : <ul className="divide-y divide-line">{unsuccessful.map((c) => (<li key={c.id}><Link href={`/dashboard/conversations/${c.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-surface/60"><span className="truncate">{c.subject || "No subject"}</span><Badge value={c.status} /></Link></li>))}</ul>}</Card>
          <Card><h2 className="mb-3 font-bold text-forest">Escalation patterns</h2>
            {!reasons.length ? <p className="text-sm text-ink-muted">No handoffs yet.</p> : <ul className="space-y-2 text-sm">{reasons.map(([r, n]) => <li key={r} className="flex justify-between gap-3"><span className="truncate">{r}</span><span className="font-semibold">{n}</span></li>)}</ul>}</Card>
          <Card><h2 className="mb-3 font-bold text-forest">Repeated complaints</h2>
            {!repeated.length ? <p className="text-sm text-ink-muted">No customer has repeated unresolved conversations this week.</p> : <ul className="space-y-2 text-sm">{repeated.map((v, i) => <li key={i}><Link href={`/dashboard/conversations/${v[0].id}`} className="hover:underline">{v.length} open conversations: {v[0].subject || "No subject"}</Link></li>)}</ul>}</Card>
          <Card><h2 className="mb-3 font-bold text-forest">Errors and failed actions</h2>
            {!(errsRes.data?.length || failedRes.data?.length) ? <p className="text-sm text-ink-muted">No errors recorded.</p> : <ul className="space-y-2 text-sm">
              {(errsRes.data ?? []).map((e) => <li key={e.id}><Link href={`/dashboard/conversations/${e.conversation_id}`} className="hover:underline"><span className="text-red-700">{(e.meta as { error?: string }).error?.slice(0, 120)}</span> <span className="text-xs text-ink-muted">{timeAgo(e.created_at)}</span></Link></li>)}
              {(failedRes.data ?? []).map((e) => <li key={e.id}><Link href="/dashboard/actions" className="hover:underline">Action {(e.assistar_actions as unknown as { name: string } | null)?.name} failed: <span className="text-red-700">{e.error}</span></Link></li>)}</ul>}</Card>
          <Card><h2 className="mb-3 font-bold text-forest">Slow responses</h2>
            {!slowRes.data?.length ? <p className="text-sm text-ink-muted">No reply took longer than 10 seconds.</p> : <ul className="space-y-2 text-sm">{slowRes.data.map((m) => <li key={m.id}><Link href={`/dashboard/conversations/${m.conversation_id}`} className="hover:underline">{((m.latency_ms ?? 0) / 1000).toFixed(1)}s <span className="text-xs text-ink-muted">{timeAgo(m.created_at)}</span></Link></li>)}</ul>}</Card>
        </div>
      )}
    </Page>
  );
}
