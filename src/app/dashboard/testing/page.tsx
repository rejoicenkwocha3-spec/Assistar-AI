import Link from "next/link";
import { canManage, getContext } from "@/lib/context";
import { Badge, Card, EmptyState, Page, PageHeader, timeAgo } from "@/components/dashboard/ui";
import { ActionForm, MiniForm, Submit } from "@/components/dashboard/ActionForm";
import { deleteScenario, runScenario, saveScenario, setVerdict } from "./actions";

export default async function TestingPage({ searchParams }: { searchParams: Promise<{ agent?: string }> }) {
  const sp = await searchParams;
  const { supabase, orgId, role } = await getContext();
  const manage = canManage(role);
  const { data: agents } = await supabase.from("assistar_agents").select("id, name, version").eq("organization_id", orgId).order("created_at");
  if (!agents?.length) return <Page><PageHeader title="Testing" description="Test agents before you publish them." /><EmptyState title="No agents to test" body="Create an agent first." href="/dashboard/agents/new" cta="Create an agent" /></Page>;
  const agent = agents.find((a) => a.id === sp.agent) ?? agents[0];
  const [{ data: scenarios }, { data: runs }, { data: versions }] = await Promise.all([
    supabase.from("assistar_test_scenarios").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false }),
    supabase.from("assistar_test_runs").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false }).limit(40),
    supabase.from("assistar_agent_versions").select("version").eq("agent_id", agent.id).order("version", { ascending: false }),
  ]);
  return (
    <Page>
      <PageHeader title="Testing" description="Save customer scenarios, run them against any version of your agent, and mark answers right or wrong. Nothing here is published." actions={<Link href={`/dashboard/studio/${agent.id}?tab=test`} className="btn-secondary">Open live test chat</Link>} />
      <div className="mb-5 flex flex-wrap gap-2">{agents.map((a) => <Link key={a.id} href={`/dashboard/testing?agent=${a.id}`} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${a.id === agent.id ? "border-forest bg-forest text-white" : "border-line bg-white"}`}>{a.name}</Link>)}</div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {!scenarios?.length && <EmptyState title="No scenarios yet" body="Add the questions your customers really ask, including difficult ones and ones that should trigger a handoff." />}
          {scenarios?.map((s) => {
            const mine = (runs ?? []).filter((r) => r.scenario_id === s.id);
            return (
              <Card key={s.id}><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-forest">{s.name}</h2><p className="mt-1 whitespace-pre-wrap text-sm">{s.prompt}</p>{s.expected && <p className="mt-2 text-xs text-ink-muted"><strong>Expected:</strong> {s.expected}</p>}</div>{manage && <MiniForm action={deleteScenario} fields={{ id: s.id }} confirm="Delete this scenario and its runs?" className="text-xs text-red-700 underline">Delete</MiniForm>}</div>
                {manage && <ActionForm action={runScenario} className="mt-3 flex flex-wrap items-center gap-2"><input type="hidden" name="id" value={s.id} />
                  <label className="sr-only" htmlFor={`v-${s.id}`}>Version</label><select id={`v-${s.id}`} name="version" defaultValue={agent.version} className="input w-auto py-1.5 text-sm">{versions?.map((v) => <option key={v.version} value={v.version}>Version {v.version}{v.version === agent.version ? " (current)" : ""}</option>)}</select>
                  <Submit pendingText="Running" className="btn-primary w-auto px-4 py-1.5 text-xs">Run</Submit></ActionForm>}
                {!!mine.length && <ul className="mt-4 space-y-3 border-t border-line pt-3">{mine.slice(0, 4).map((r) => (
                  <li key={r.id} className="rounded-lg bg-surface p-3 text-sm"><div className="mb-1 flex items-center justify-between gap-2 text-xs text-ink-muted"><span>Version {r.agent_version} · {timeAgo(r.created_at)}{r.latency_ms ? ` · ${r.latency_ms} ms` : ""}</span>{r.verdict && <Badge value={r.verdict} />}</div>
                    {r.error ? <p className="text-red-700">{r.error}</p> : <p className="whitespace-pre-wrap">{r.response}</p>}
                    {manage && !r.error && <div className="mt-2 flex gap-2"><MiniForm action={setVerdict} fields={{ id: r.id, verdict: "pass" }}>Correct</MiniForm><MiniForm action={setVerdict} fields={{ id: r.id, verdict: "fail" }}>Incorrect</MiniForm></div>}</li>))}</ul>}
              </Card>);
          })}
        </div>
        <Card className="h-fit lg:col-span-2"><h2 className="mb-3 font-bold text-forest">New scenario</h2>
          {manage ? <ActionForm action={saveScenario} resetOnSuccess><input type="hidden" name="agent_id" value={agent.id} />
            <div className="space-y-3"><div><label className="label" htmlFor="sn">Name</label><input id="sn" name="name" className="input" placeholder="Refund after 45 days" /></div>
              <div><label className="label" htmlFor="sp">Customer message</label><textarea id="sp" name="prompt" rows={3} className="input" /></div>
              <div><label className="label" htmlFor="se">What a good answer does (optional)</label><textarea id="se" name="expected" rows={2} className="input" /></div>
              <Submit className="btn-primary">Save scenario</Submit></div></ActionForm> : <p className="text-sm text-ink-muted">Only managers and admins can add scenarios.</p>}</Card>
      </div>
    </Page>
  );
}
