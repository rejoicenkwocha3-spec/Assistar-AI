import Link from "next/link";
import { headers } from "next/headers";
import { canManage, getContext } from "@/lib/context";
import { hasServiceRole } from "@/lib/supabase/admin";
import { providerStatus } from "@/lib/ai/providers";
import { Badge, Card, ConfigBanner, EmptyState, Page, PageHeader } from "@/components/dashboard/ui";
import { ActionForm, MiniForm, Submit } from "@/components/dashboard/ActionForm";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { createWidget, deleteWidget, saveWidget } from "./actions";

export default async function WidgetPage({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const { w } = await searchParams;
  const { supabase, orgId, role } = await getContext();
  const manage = canManage(role);
  const [{ data: widgets }, { data: agents }] = await Promise.all([
    supabase.from("assistar_widgets").select("*").eq("organization_id", orgId).order("created_at"),
    supabase.from("assistar_agents").select("id, name, status").eq("organization_id", orgId),
  ]);
  const widget = widgets?.find((x) => x.id === w) ?? widgets?.[0];
  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const agent = agents?.find((a) => a.id === widget?.agent_id);
  const p = providerStatus();
  const snippet = widget ? `<script src="${origin}/widget.js" data-key="${widget.public_key}" data-color="${widget.brand_color}" async></script>` : "";

  return (
    <Page>
      <PageHeader title="Website Widget" description="Embed your assistant on any website. Visitors chat with the published version of the attached agent."
        actions={manage && <form action={createWidget}><Submit className="btn-primary w-auto px-5">New widget</Submit></form>} />
      {!hasServiceRole() && <ConfigBanner>The widget needs <code>SUPABASE_SERVICE_ROLE_KEY</code> in your server environment to store visitor conversations. Until it is set, the widget cannot reply.</ConfigBanner>}
      {!p.anthropic && !p.openai && <ConfigBanner>No AI provider key is configured on the server, so the widget cannot generate replies yet.</ConfigBanner>}
      {!widget ? <EmptyState title="No widget yet" body="Create a widget, choose an agent, customise it, and copy the install script." /> : (
        <>
          {widgets && widgets.length > 1 && <div className="mb-4 flex flex-wrap gap-2">{widgets.map((x) => <Link key={x.id} href={`/dashboard/widget?w=${x.id}`} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${x.id === widget.id ? "border-forest bg-forest text-white" : "border-line bg-white"}`}>{x.name}</Link>)}</div>}
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <Card><h2 className="mb-4 font-bold text-forest">Appearance and behavior</h2>
                <ActionForm action={saveWidget}><input type="hidden" name="id" value={widget.id} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><label className="label" htmlFor="name">Widget name</label><input id="name" name="name" defaultValue={widget.name} disabled={!manage} className="input" /></div>
                    <div><label className="label" htmlFor="assistant_name">Assistant name</label><input id="assistant_name" name="assistant_name" defaultValue={widget.assistant_name} disabled={!manage} className="input" /></div>
                    <div><label className="label" htmlFor="agent_id">Agent</label><select id="agent_id" name="agent_id" defaultValue={widget.agent_id ?? ""} disabled={!manage} className="input"><option value="">None</option>{agents?.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.status})</option>)}</select></div>
                    <div><label className="label" htmlFor="brand_color">Brand color</label><input id="brand_color" name="brand_color" type="color" defaultValue={widget.brand_color} disabled={!manage} className="h-10 w-full cursor-pointer rounded-lg border border-line bg-white p-1" /></div>
                    <div className="md:col-span-2"><label className="label" htmlFor="logo_url">Logo URL (https image)</label><input id="logo_url" name="logo_url" defaultValue={widget.logo_url ?? ""} disabled={!manage} className="input" placeholder="https://example.com/logo.png" /></div>
                    <div className="md:col-span-2"><label className="label" htmlFor="welcome_message">Welcome message</label><textarea id="welcome_message" name="welcome_message" rows={2} defaultValue={widget.welcome_message} disabled={!manage} className="input" /></div>
                    <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="active" defaultChecked={widget.active} disabled={!manage} className="accent-forest" /> Widget is active</label>
                  </div>
                  {manage && <div className="mt-4 flex gap-2"><Submit className="btn-primary w-auto px-6">Save widget</Submit></div>}
                </ActionForm>
                {manage && <div className="mt-3"><MiniForm action={deleteWidget} fields={{ id: widget.id }} confirm="Delete this widget? Installed scripts will stop working." className="text-xs text-red-700 underline">Delete widget</MiniForm></div>}
              </Card>
              <Card><h2 className="mb-1 font-bold text-forest">Install on your website</h2>
                <p className="mb-3 text-sm text-ink-muted">Paste this before the closing <code>&lt;/body&gt;</code> tag on every page where the chat should appear.</p>
                <pre className="overflow-x-auto rounded-lg bg-forest-deep p-4 text-xs text-sage">{snippet}</pre>
                <div className="mt-3"><CopyButton text={snippet} /></div>
                {(!agent || agent.status !== "published") && <p className="mt-3 text-sm text-amber-800">{agent ? `${agent.name} is ${agent.status}. Publish it so visitors get answers.` : "Attach an agent so visitors get answers."}</p>}
              </Card>
            </div>
            <div className="lg:col-span-2"><Card className="sticky top-6 p-3"><div className="mb-2 flex items-center justify-between px-2"><h2 className="font-bold text-forest">Live preview</h2><Badge value={widget.active ? "active" : "paused"} /></div>
              <iframe key={`${widget.id}-${widget.brand_color}-${widget.assistant_name}-${widget.welcome_message}-${widget.logo_url}`} src={`/widget/${widget.public_key}?preview=1`} title="Widget preview" className="h-[520px] w-full rounded-lg border border-line" />
              <p className="mt-2 px-2 text-xs text-ink-muted">Preview messages are real: they go to the published agent and appear in Conversations. Save to refresh the preview after changes.</p></Card></div>
          </div>
        </>
      )}
    </Page>
  );
}
