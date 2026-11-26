import Link from "next/link";
import { Bot, Library, MessageSquare, Plus, Code2, FlaskConical } from "lucide-react";
import { getContext } from "@/lib/context";
import { providerStatus } from "@/lib/ai/providers";
import { planByKey } from "@/config/plans";
import { Badge, Card, ConfigBanner, EmptyState, Page, PageHeader, Stat, timeAgo } from "@/components/dashboard/ui";

export default async function OverviewPage() {
  const { supabase, orgId, profile, org } = await getContext();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [agents, convs, usage, sub, handoffs, execs, widgets, sources] = await Promise.all([
    supabase.from("assistar_agents").select("id, name, status").eq("organization_id", orgId),
    supabase.from("assistar_conversations").select("id, status, resolved_by_ai, agent_id, subject, channel, created_at, last_message_at").eq("organization_id", orgId).gte("created_at", since).order("last_message_at", { ascending: false }).limit(1000),
    supabase.from("assistar_usage_events").select("quantity").eq("organization_id", orgId).gte("created_at", monthStart),
    supabase.from("assistar_subscriptions").select("plan_key, status, current_period_end").eq("organization_id", orgId).maybeSingle(),
    supabase.from("assistar_handoffs").select("id, reason, created_at, conversation_id").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5),
    supabase.from("assistar_action_executions").select("id, status, created_at, assistar_actions(name)").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5),
    supabase.from("assistar_widgets").select("id").eq("organization_id", orgId),
    supabase.from("assistar_knowledge_sources").select("id").eq("organization_id", orgId).eq("status", "ready"),
  ]);

  const agentList = agents.data ?? [];
  const convList = convs.data ?? [];
  const resolved = convList.filter((c) => c.status === "resolved").length;
  const byAi = convList.filter((c) => c.resolved_by_ai).length;
  const rate = convList.length ? Math.round((resolved / convList.length) * 100) : null;
  const messagesThisMonth = (usage.data ?? []).reduce((n, r) => n + r.quantity, 0);
  const plan = sub.data ? planByKey(sub.data.plan_key) : null;
  const providers = providerStatus();
  const aiConfigured = providers.anthropic || providers.openai;

  const perAgent = agentList.map((a) => {
    const mine = convList.filter((c) => c.agent_id === a.id);
    return { ...a, total: mine.length, resolved: mine.filter((c) => c.status === "resolved").length, escalated: mine.filter((c) => c.status === "escalated").length };
  });

  type Activity = { at: string; text: string; href: string };
  const activity: Activity[] = [
    ...(handoffs.data ?? []).map((h) => ({ at: h.created_at, text: `Handoff requested: ${h.reason || "no reason given"}`, href: `/dashboard/conversations/${h.conversation_id}` })),
    ...(execs.data ?? []).map((e) => ({ at: e.created_at, text: `Action ${(e.assistar_actions as unknown as { name: string } | null)?.name ?? ""} ${e.status.replace("_", " ")}`, href: "/dashboard/actions" })),
    ...convList.slice(0, 5).map((c) => ({ at: c.created_at, text: `New ${c.channel} conversation: ${c.subject || "No subject"}`, href: `/dashboard/conversations/${c.id}` })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 6);

  const setup = [
    { done: aiConfigured, label: "Add an AI provider key on the server", href: "/dashboard/settings" },
    { done: agentList.length > 0, label: "Create your first AI agent", href: "/dashboard/agents/new" },
    { done: (sources.data ?? []).length > 0, label: "Add knowledge for your agent", href: "/dashboard/knowledge" },
    { done: agentList.some((a) => a.status === "published"), label: "Publish an agent", href: "/dashboard/agents" },
    { done: (widgets.data ?? []).length > 0, label: "Install the website widget", href: "/dashboard/widget" },
  ];

  return (
    <Page>
      <PageHeader title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`} description={`${org.name}: here is what is happening across your assistants.`} />
      {!aiConfigured && (
        <ConfigBanner>
          No AI provider is configured. Agents cannot reply until <code>ANTHROPIC_API_KEY</code> or <code>OPENAI_API_KEY</code> is set in your server environment. <Link href="/dashboard/settings" className="font-semibold underline">See setup</Link>.
        </ConfigBanner>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active agents" value={agentList.filter((a) => a.status === "published").length} hint={`${agentList.length} total`} />
        <Stat label="Conversations, 30 days" value={convList.length} />
        <Stat label="Resolution rate" value={rate === null ? "No data" : `${rate}%`} hint={convList.length ? `${byAi} resolved by AI` : "Appears after your first conversation"} />
        <Stat label="AI messages this month" value={messagesThisMonth} hint={plan ? `${plan.name}, ${sub.data?.status}` : "No active subscription"} />
      </div>

      {setup.some((s) => !s.done) && (
        <Card className="mt-6">
          <h2 className="font-bold text-forest">Get set up</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {setup.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-sm hover:bg-surface">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${s.done ? "bg-success text-white" : "border border-line text-transparent"}`}>✓</span>
                  <span className={s.done ? "text-ink-muted line-through" : "font-medium"}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-forest">Recent conversations</h2><Link href="/dashboard/conversations" className="text-sm font-semibold text-forest hover:underline">View all</Link></div>
            {convList.length === 0 ? (
              <EmptyState title="No conversations yet" body="Publish an agent and install the website widget to start receiving conversations." href="/dashboard/widget" cta="Set up the widget" />
            ) : (
              <ul className="divide-y divide-line">
                {convList.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <Link href={`/dashboard/conversations/${c.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-surface/60">
                      <span className="min-w-0"><span className="block truncate text-sm font-medium">{c.subject || "No subject"}</span><span className="text-xs text-ink-muted">{c.channel} · {timeAgo(c.last_message_at)}</span></span>
                      <Badge value={c.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="mb-3 font-bold text-forest">Agent performance</h2>
            {perAgent.length === 0 ? (
              <EmptyState title="No agents yet" body="Create an agent from a template or start from scratch." href="/dashboard/agents/new" cta="Create an agent" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-ink-muted"><tr><th className="pb-2">Agent</th><th className="pb-2">Status</th><th className="pb-2 text-right">Conversations</th><th className="pb-2 text-right">Resolved</th><th className="pb-2 text-right">Escalated</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {perAgent.map((a) => (
                      <tr key={a.id}><td className="py-2.5 font-medium"><Link href={`/dashboard/studio/${a.id}`} className="hover:underline">{a.name}</Link></td><td><Badge value={a.status} /></td><td className="text-right">{a.total}</td><td className="text-right">{a.resolved}</td><td className="text-right">{a.escalated}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-bold text-forest">Quick actions</h2>
            <div className="grid gap-2">
              {[{ href: "/dashboard/agents/new", label: "New agent", icon: Plus }, { href: "/dashboard/knowledge", label: "Add knowledge", icon: Library }, { href: "/dashboard/testing", label: "Test an agent", icon: FlaskConical }, { href: "/dashboard/widget", label: "Website widget", icon: Code2 }, { href: "/dashboard/conversations", label: "Open inbox", icon: MessageSquare }, { href: "/dashboard/agents", label: "Manage agents", icon: Bot }].map(({ href, label, icon: I }) => (
                <Link key={href} href={href} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-sm font-medium hover:bg-surface"><I size={16} className="text-forest" /> {label}</Link>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="mb-3 font-bold text-forest">Recent activity</h2>
            {activity.length === 0 ? <p className="text-sm text-ink-muted">Activity appears here as conversations, handoffs and actions happen.</p> : (
              <ul className="space-y-3">{activity.map((a, i) => (<li key={i}><Link href={a.href} className="block text-sm hover:underline">{a.text}<span className="block text-xs text-ink-muted">{timeAgo(a.at)}</span></Link></li>))}</ul>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}
