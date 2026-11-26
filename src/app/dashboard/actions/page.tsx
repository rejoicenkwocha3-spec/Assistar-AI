import { canManage, getContext } from "@/lib/context";
import { Badge, Card, EmptyState, Page, PageHeader, timeAgo } from "@/components/dashboard/ui";
import { ActionForm, MiniForm, Submit } from "@/components/dashboard/ActionForm";
import { decideExecution, deleteActionDef, saveActionDef, testActionDef } from "./actions";

export default async function ActionsPage() {
  const { supabase, orgId, role } = await getContext();
  if (!canManage(role)) return <Page><PageHeader title="Actions" description="Only managers and admins can manage actions." /></Page>;
  const [{ data: defs }, { data: execs }] = await Promise.all([
    supabase.from("assistar_actions").select("*").eq("organization_id", orgId).order("created_at"),
    supabase.from("assistar_action_executions").select("id, status, input, output, error, duration_ms, requested_by, created_at, assistar_actions(name)").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(25),
  ]);
  const pending = (execs ?? []).filter((e) => e.status === "pending_approval");
  return (
    <Page>
      <PageHeader title="Actions" description="Approved tasks your agents can request, such as checking an order or creating a ticket. Each action calls a webhook you control." />
      {!!pending.length && (
        <Card className="mb-6 border-amber-300 bg-amber-50"><h2 className="mb-3 font-bold text-amber-900">Waiting for your approval ({pending.length})</h2>
          <ul className="divide-y divide-amber-200">{pending.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span><strong>{(e.assistar_actions as unknown as { name: string } | null)?.name}</strong><code className="ml-2 break-all text-xs">{JSON.stringify(e.input)}</code><span className="block text-xs text-ink-muted">Requested by {e.requested_by} · {timeAgo(e.created_at)}</span></span>
              <span className="flex gap-2"><MiniForm action={decideExecution} fields={{ id: e.id, decision: "approve" }} className="btn-primary w-auto px-4 py-1.5 text-xs">Approve and run</MiniForm><MiniForm action={decideExecution} fields={{ id: e.id, decision: "reject" }}>Reject</MiniForm></span></li>))}</ul></Card>)}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {!defs?.length && <EmptyState title="No actions yet" body="Create your first action using the form. Until you do, agents can only answer questions." />}
          {defs?.map((d) => (
            <Card key={d.id}><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-forest">{d.name}</h2><p className="text-xs text-ink-muted"><code>{d.slug}</code> · {d.method} {new URL(d.url).host}</p></div><div className="flex gap-2">{d.requires_confirmation && <Badge value="pending" />}<Badge value={d.enabled ? "active" : "paused"} /></div></div>
              <p className="mt-2 text-sm text-ink-muted">{d.description || "No description"}</p>
              <p className="mt-1 text-xs text-ink-muted">Inputs: {d.parameters.join(", ") || "none"} · {d.requires_confirmation ? "A person approves each run" : "Runs automatically"}</p>
              <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-forest">Edit or test</summary>
                <ActionForm action={saveActionDef} className="mt-3"><input type="hidden" name="id" value={d.id} /><ActionFields d={d} /><div className="mt-3 flex gap-2"><Submit className="btn-primary w-auto px-5">Save</Submit></div></ActionForm>
                <ActionForm action={testActionDef} className="mt-4 border-t border-line pt-4"><input type="hidden" name="id" value={d.id} />
                  <label className="label" htmlFor={`in-${d.id}`}>Test input (JSON)</label><textarea id={`in-${d.id}`} name="input" rows={2} className="input font-mono text-xs" placeholder={`{${d.parameters.map((p: string) => `"${p}": "value"`).join(", ")}}`} />
                  <div className="mt-2"><Submit className="btn-secondary">Run a real test call</Submit></div></ActionForm>
                <div className="mt-3"><MiniForm action={deleteActionDef} fields={{ id: d.id }} confirm={`Delete ${d.name}?`} className="text-xs text-red-700 underline">Delete action</MiniForm></div></details></Card>))}

          <Card><h2 className="mb-3 font-bold text-forest">Execution log</h2>
            {!execs?.length ? <p className="text-sm text-ink-muted">Nothing has run yet. Every request, approval, success and error is recorded here.</p> : (
              <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase tracking-wide text-ink-muted"><tr><th className="pb-2">Action</th><th className="pb-2">Status</th><th className="pb-2">By</th><th className="pb-2">Detail</th><th className="pb-2 text-right">When</th></tr></thead>
                <tbody className="divide-y divide-line">{execs.map((e) => (<tr key={e.id}><td className="py-2 font-medium">{(e.assistar_actions as unknown as { name: string } | null)?.name}</td><td><Badge value={e.status} /></td><td>{e.requested_by}</td><td className="max-w-[240px] truncate text-xs text-ink-muted">{e.error || (e.output ?? "").slice(0, 80) || JSON.stringify(e.input).slice(0, 80)}</td><td className="text-right text-xs text-ink-muted">{timeAgo(e.created_at)}</td></tr>))}</tbody></table></div>)}</Card>
        </div>
        <Card className="h-fit lg:col-span-2"><h2 className="mb-3 font-bold text-forest">New action</h2>
          <ActionForm action={saveActionDef} resetOnSuccess><ActionFields /><div className="mt-3"><Submit className="btn-primary">Create action</Submit></div></ActionForm></Card>
      </div>
    </Page>
  );
}

function ActionFields({ d }: { d?: { slug: string; name: string; description: string; url: string; method: string; headers: Record<string, string>; parameters: string[]; requires_confirmation: boolean; enabled: boolean } }) {
  return (
    <div className="space-y-3">
      <div><label className="label">Name</label><input name="name" defaultValue={d?.name} className="input py-2" placeholder="Check order status" /></div>
      <div><label className="label">Identifier</label><input name="slug" defaultValue={d?.slug} className="input py-2 font-mono text-sm" placeholder="check_order_status" /></div>
      <div><label className="label">When should the agent use it?</label><input name="description" defaultValue={d?.description} className="input py-2" placeholder="Look up an order when the customer gives an order number" /></div>
      <div><label className="label">Webhook URL (https)</label><input name="url" defaultValue={d?.url} className="input py-2" placeholder="https://api.example.com/orders/lookup" /></div>
      <div className="grid grid-cols-2 gap-3"><div><label className="label">Method</label><select name="method" defaultValue={d?.method ?? "POST"} className="input py-2"><option>POST</option><option>PUT</option><option>PATCH</option></select></div>
        <div><label className="label">Inputs (comma separated)</label><input name="parameters" defaultValue={d?.parameters.join(", ")} className="input py-2" placeholder="order_number, email" /></div></div>
      <div><label className="label">Headers (JSON, optional)</label><textarea name="headers" rows={2} defaultValue={d && Object.keys(d.headers).length ? JSON.stringify(d.headers) : ""} className="input font-mono text-xs" placeholder='{"Authorization": "Bearer ..."}' /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="requires_confirmation" defaultChecked={d?.requires_confirmation ?? true} className="accent-forest" /> A person must approve each run</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={d?.enabled ?? true} className="accent-forest" /> Enabled</label>
    </div>
  );
}
