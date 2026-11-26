import Link from "next/link";
import { getContext } from "@/lib/context";
import { Badge, Card, EmptyState, Page, PageHeader, Stat, timeAgo } from "@/components/dashboard/ui";
import { ChannelChart, TrendChart } from "@/components/dashboard/Charts";

const RANGES = [7, 30, 90];

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = RANGES.includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30;
  const { supabase, orgId } = await getContext();
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const [{ data: convs }, { data: lat }, { data: agents }, { data: handoffs }] = await Promise.all([
    supabase.from("assistar_conversations").select("id, status, channel, subject, resolved_by_ai, satisfaction, created_at, last_message_at").eq("organization_id", orgId).gte("created_at", since).limit(5000),
    supabase.from("assistar_messages").select("latency_ms").eq("organization_id", orgId).eq("role", "assistant").not("latency_ms", "is", null).gte("created_at", since).limit(5000),
    supabase.from("assistar_agents").select("id, status").eq("organization_id", orgId),
    supabase.from("assistar_handoffs").select("id").eq("organization_id", orgId).gte("created_at", since),
  ]);
  const list = convs ?? [];
  const total = list.length;
  const resolved = list.filter((c) => c.status === "resolved").length;
  const byAi = list.filter((c) => c.resolved_by_ai).length;
  const rated = list.filter((c) => c.satisfaction != null);
  const csat = rated.length ? (rated.reduce((n, c) => n + (c.satisfaction ?? 0), 0) / rated.length).toFixed(1) : null;
  const avgLatency = lat?.length ? Math.round(lat.reduce((n, m) => n + (m.latency_ms ?? 0), 0) / lat.length) : null;

  const dayKey = (iso: string) => iso.slice(0, 10);
  const trend: Record<string, { day: string; conversations: number; escalated: number }> = {};
  for (let i = days - 1; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); trend[d] = { day: d.slice(5), conversations: 0, escalated: 0 }; }
  for (const c of list) { const t = trend[dayKey(c.created_at)]; if (t) { t.conversations++; if (c.status === "escalated") t.escalated++; } }

  const channels = Object.values(list.reduce<Record<string, { channel: string; total: number; resolved: number }>>((acc, c) => {
    (acc[c.channel] ??= { channel: c.channel, total: 0, resolved: 0 }).total++; if (c.status === "resolved") acc[c.channel].resolved++; return acc;
  }, {}));

  const topics = Object.entries(list.reduce<Record<string, number>>((acc, c) => { const k = (c.subject || "").trim().toLowerCase(); if (k) acc[k] = (acc[k] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const unresolved = list.filter((c) => c.status !== "resolved").sort((a, b) => +new Date(a.last_message_at) - +new Date(b.last_message_at)).slice(0, 8);

  return (
    <Page>
      <PageHeader title="Analytics" description="Calculated from your real conversations. Nothing here is sample data."
        actions={<div className="flex gap-1">{RANGES.map((r) => <Link key={r} href={`/dashboard/analytics?days=${r}`} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${r === days ? "border-forest bg-forest text-white" : "border-line bg-white"}`}>{r} days</Link>)}</div>} />
      {total === 0 ? <EmptyState title="No conversations in this period" body="Charts appear once customers start chatting. Install the widget and publish an agent to begin." href="/dashboard/widget" cta="Set up the widget" /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total conversations" value={total} />
            <Stat label="Resolved by AI" value={byAi} hint="Customer confirmed the assistant solved it" />
            <Stat label="Human escalations" value={handoffs?.length ?? 0} />
            <Stat label="Resolution rate" value={`${Math.round((resolved / total) * 100)}%`} hint={`${resolved} of ${total} resolved`} />
            <Stat label="Avg response time" value={avgLatency === null ? "No data" : `${(avgLatency / 1000).toFixed(1)}s`} hint="AI reply generation time" />
            <Stat label="Customer satisfaction" value={csat ? `${csat} / 5` : "No ratings"} hint={csat ? `${rated.length} rating${rated.length === 1 ? "" : "s"}` : "Visitors rate after an AI answer"} />
            <Stat label="Active agents" value={(agents ?? []).filter((a) => a.status === "published").length} hint={`${agents?.length ?? 0} total`} />
            <Stat label="Escalated now" value={list.filter((c) => c.status === "escalated").length} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2"><h2 className="mb-3 font-bold text-forest">Conversation trend</h2><TrendChart data={Object.values(trend)} /></Card>
            <Card><h2 className="mb-3 font-bold text-forest">Channel performance</h2><ChannelChart data={channels} /></Card>
            <Card><h2 className="mb-3 font-bold text-forest">Common customer questions</h2>
              <ol className="space-y-2 text-sm">{topics.map(([t, n]) => <li key={t} className="flex justify-between gap-3"><span className="truncate capitalize">{t}</span><span className="font-semibold">{n}</span></li>)}{!topics.length && <li className="text-ink-muted">No topics yet.</li>}</ol></Card>
            <Card className="lg:col-span-2"><h2 className="mb-3 font-bold text-forest">Unresolved customer issues</h2>
              {!unresolved.length ? <p className="text-sm text-ink-muted">Everything in this period is resolved.</p> : <ul className="divide-y divide-line">{unresolved.map((c) => (<li key={c.id}><Link href={`/dashboard/conversations/${c.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-surface/60"><span className="truncate">{c.subject || "No subject"}<span className="ml-2 text-xs text-ink-muted">{timeAgo(c.last_message_at)}</span></span><Badge value={c.status} /></Link></li>))}</ul>}</Card>
          </div>
        </>
      )}
    </Page>
  );
}
