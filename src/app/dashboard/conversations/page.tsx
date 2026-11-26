import Link from "next/link";
import { getContext } from "@/lib/context";
import { Badge, Card, EmptyState, Page, PageHeader, timeAgo } from "@/components/dashboard/ui";

const FILTERS = [["all", "All"], ["open", "Open"], ["pending", "Pending"], ["escalated", "Escalated"], ["resolved", "Resolved"], ["mine", "Assigned to me"]] as const;

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "all", q = "" } = await searchParams;
  const { supabase, orgId, user } = await getContext();
  let query = supabase.from("assistar_conversations")
    .select("id, subject, status, channel, last_message_at, assigned_to, assistar_agents(name), assistar_customers(name, email)")
    .eq("organization_id", orgId).order("last_message_at", { ascending: false }).limit(100);
  if (["open", "pending", "escalated", "resolved"].includes(status)) query = query.eq("status", status);
  if (status === "mine") query = query.eq("assigned_to", user.id);
  if (q.trim()) query = query.ilike("subject", `%${q.trim().replace(/[%_]/g, "")}%`);
  const { data: convs } = await query;

  return (
    <Page>
      <PageHeader title="Conversations" description="Every customer conversation across channels, with AI and human replies in one thread." />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto">{FILTERS.map(([k, l]) => (
          <Link key={k} href={`/dashboard/conversations?status=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${status === k ? "bg-forest text-white" : "bg-white text-ink hover:bg-surface border border-line"}`}>{l}</Link>))}</div>
        <form className="flex gap-2"><input type="hidden" name="status" value={status} /><input name="q" defaultValue={q} placeholder="Search subjects" className="input w-56 py-2" aria-label="Search conversations" /><button className="btn-secondary" type="submit">Search</button></form>
      </div>
      {!convs?.length ? <EmptyState title="No conversations here" body={status === "all" && !q ? "Conversations appear when customers chat through your website widget." : "Nothing matches this filter."} href={status === "all" && !q ? "/dashboard/widget" : undefined} cta="Set up the widget" /> : (
        <Card className="p-0"><ul className="divide-y divide-line">
          {convs.map((c) => {
            const cust = c.assistar_customers as unknown as { name: string | null; email: string | null } | null;
            const agent = c.assistar_agents as unknown as { name: string } | null;
            return (<li key={c.id}><Link href={`/dashboard/conversations/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-surface/60">
              <span className="min-w-0"><span className="block truncate font-medium">{c.subject || "No subject"}</span>
                <span className="text-xs text-ink-muted">{cust?.name || cust?.email || "Anonymous visitor"} · {c.channel}{agent ? ` · ${agent.name}` : ""} · {timeAgo(c.last_message_at)}{c.assigned_to === user.id ? " · assigned to you" : ""}</span></span>
              <Badge value={c.status} /></Link></li>);
          })}</ul></Card>
      )}
    </Page>
  );
}
