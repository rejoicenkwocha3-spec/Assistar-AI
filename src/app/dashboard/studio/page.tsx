import Link from "next/link";
import { getContext } from "@/lib/context";
import { Badge, Card, EmptyState, Page, PageHeader, timeAgo } from "@/components/dashboard/ui";

export default async function StudioIndex() {
  const { supabase, orgId } = await getContext();
  const { data: agents } = await supabase.from("assistar_agents").select("id, name, status, version, updated_at").eq("organization_id", orgId).order("updated_at", { ascending: false });
  return (
    <Page>
      <PageHeader title="Agent Studio" description="Edit instructions, personality, guardrails and models. Test changes and roll back at any time." />
      {!agents?.length ? <EmptyState title="No agents to edit" body="Create an agent first, then refine it here." href="/dashboard/agents/new" cta="Create an agent" /> : (
        <div className="grid gap-3">
          {agents.map((a) => (
            <Link key={a.id} href={`/dashboard/studio/${a.id}`}><Card className="flex items-center justify-between gap-3 transition hover:border-forest">
              <div><p className="font-bold text-forest">{a.name}</p><p className="text-xs text-ink-muted">Version {a.version} · updated {timeAgo(a.updated_at)}</p></div><Badge value={a.status} />
            </Card></Link>
          ))}
        </div>
      )}
    </Page>
  );
}
