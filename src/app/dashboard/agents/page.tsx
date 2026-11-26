import Link from "next/link";
import { Plus } from "lucide-react";
import { canManage, getContext } from "@/lib/context";
import { Badge, Card, EmptyState, Page, PageHeader, timeAgo } from "@/components/dashboard/ui";
import { MiniForm } from "@/components/dashboard/ActionForm";
import { deleteAgent, setAgentStatus } from "./actions";

export default async function AgentsPage() {
  const { supabase, orgId, role } = await getContext();
  const { data: agents } = await supabase.from("assistar_agents").select("id, name, description, status, template, version, provider, model, updated_at").eq("organization_id", orgId).order("created_at", { ascending: false });
  const manage = canManage(role);
  return (
    <Page>
      <PageHeader title="AI Agents" description="Create, publish and pause the assistants that talk to your customers."
        actions={manage && <Link href="/dashboard/agents/new" className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-deep"><Plus size={16} /> New agent</Link>} />
      {!agents?.length ? (
        <EmptyState title="No agents yet" body="Start from a template for a common business need, or build a custom agent." href={manage ? "/dashboard/agents/new" : undefined} cta="Create an agent" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((a) => (
            <Card key={a.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><Link href={`/dashboard/studio/${a.id}`} className="block truncate text-lg font-bold text-forest hover:underline">{a.name}</Link><p className="mt-1 line-clamp-2 text-sm text-ink-muted">{a.description || "No description"}</p></div>
                <Badge value={a.status} />
              </div>
              <p className="mt-3 text-xs text-ink-muted">Version {a.version} · {a.provider} {a.model} · updated {timeAgo(a.updated_at)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/dashboard/studio/${a.id}`} className="btn-secondary py-1.5 text-xs">Open in Studio</Link>
                {manage && a.status !== "published" && <MiniForm action={setAgentStatus} fields={{ id: a.id, status: "published" }} className="btn-primary w-auto px-4 py-1.5 text-xs">Publish</MiniForm>}
                {manage && a.status === "published" && <MiniForm action={setAgentStatus} fields={{ id: a.id, status: "paused" }}>Pause</MiniForm>}
                {manage && <MiniForm action={deleteAgent} fields={{ id: a.id }} confirm={`Delete ${a.name}? This also removes its versions and tests.`} className="btn-secondary py-1.5 text-xs text-red-700">Delete</MiniForm>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}
