import Link from "next/link";
import { notFound } from "next/navigation";
import { canManage, getContext } from "@/lib/context";
import { DEFAULT_MODELS, providerStatus } from "@/lib/ai/providers";
import { TONES } from "@/lib/agents";
import { Badge, Card, ConfigBanner, Page, PageHeader, timeAgo } from "@/components/dashboard/ui";
import { ActionForm, MiniForm, Submit } from "@/components/dashboard/ActionForm";
import { AgentTester } from "@/components/dashboard/AgentTester";
import { setAgentStatus } from "../../agents/actions";
import { attachWidget, restoreVersion, saveAgent } from "../actions";

const TABS = [["overview", "Overview"], ["instructions", "Instructions"], ["personality", "Personality"], ["guardrails", "Guardrails"], ["model", "Model"], ["channels", "Channels"], ["test", "Test"], ["versions", "Versions"]] as const;

export default async function StudioAgent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const tab = (await searchParams).tab ?? "overview";
  const { supabase, orgId, role } = await getContext();
  const { data: agent } = await supabase.from("assistar_agents").select("*").eq("id", id).eq("organization_id", orgId).maybeSingle();
  if (!agent) notFound();
  const manage = canManage(role);
  const providers = providerStatus();

  const Field = ({ name, label, rows = 6, hint }: { name: string; label: string; rows?: number; hint?: string }) => (
    <div><label className="label" htmlFor={name}>{label}</label>
      <textarea id={name} name={name} rows={rows} defaultValue={agent[name] ?? ""} disabled={!manage} className="input" />
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}</div>
  );
  const SaveBar = () => manage ? (
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <div className="min-w-[220px] flex-1"><label className="label" htmlFor="note">Version note (optional)</label><input id="note" name="note" className="input" maxLength={200} placeholder="What did you change?" /></div>
      <Submit className="btn-primary w-auto px-6">Save as new version</Submit>
    </div>
  ) : <p className="mt-4 text-sm text-ink-muted">You have read only access to this agent.</p>;

  let body: React.ReactNode = null;

  if (tab === "overview") {
    const [{ count: convCount }, { count: kbCount }] = await Promise.all([
      supabase.from("assistar_conversations").select("id", { count: "exact", head: true }).eq("agent_id", id),
      supabase.from("assistar_knowledge_sources").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "ready"),
    ]);
    body = (
      <div className="grid gap-4 md:grid-cols-2">
        <Card><h2 className="font-bold text-forest">Publishing</h2>
          <p className="mt-1 text-sm text-ink-muted">Only a published agent answers customers on the website widget. Edits create new versions but do not change what customers see until you publish.</p>
          {agent.published_version != null && <p className="mt-2 text-sm">Live version: <strong>{agent.published_version}</strong>{agent.published_version !== agent.version && <span className="text-amber-800"> (version {agent.version} has unpublished changes)</span>}</p>}
          <div className="mt-4 flex items-center gap-3"><Badge value={agent.status} />
            {manage && (agent.status === "published" ? <MiniForm action={setAgentStatus} fields={{ id, status: "paused" }}>Pause agent</MiniForm> : <MiniForm action={setAgentStatus} fields={{ id, status: "published" }} className="btn-primary w-auto px-4 py-1.5 text-xs">Publish version {agent.version}</MiniForm>)}
            {manage && agent.status === "published" && agent.published_version !== agent.version && <MiniForm action={setAgentStatus} fields={{ id, status: "published" }} className="btn-primary w-auto px-4 py-1.5 text-xs">Publish version {agent.version}</MiniForm>}
          </div>
          {!providers[agent.provider as "anthropic" | "openai"] && <p className="mt-3 text-sm text-amber-800">The {agent.provider} API key is not configured on the server, so this agent cannot answer yet.</p>}
        </Card>
        <Card><h2 className="font-bold text-forest">At a glance</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-ink-muted">Version</dt><dd className="font-semibold">{agent.version}</dd></div><div><dt className="text-ink-muted">Model</dt><dd className="font-semibold">{agent.provider} / {agent.model}</dd></div><div><dt className="text-ink-muted">Conversations</dt><dd className="font-semibold">{convCount ?? 0}</dd></div><div><dt className="text-ink-muted">Knowledge sources ready</dt><dd className="font-semibold">{kbCount ?? 0}</dd></div></dl>
          <Link href="/dashboard/knowledge" className="mt-3 inline-block text-sm font-semibold text-forest hover:underline">Manage knowledge</Link>
        </Card>
        <Card className="md:col-span-2"><h2 className="mb-3 font-bold text-forest">Name and description</h2>
          <ActionForm action={saveAgent}><input type="hidden" name="id" value={id} />
            <div className="grid gap-4 md:grid-cols-2"><div><label className="label" htmlFor="name">Name</label><input id="name" name="name" defaultValue={agent.name} disabled={!manage} className="input" maxLength={120} /></div><div><label className="label" htmlFor="description">Description</label><input id="description" name="description" defaultValue={agent.description} disabled={!manage} className="input" maxLength={500} /></div></div>
            <SaveBar /></ActionForm></Card>
      </div>
    );
  } else if (tab === "instructions") {
    body = <Card><ActionForm action={saveAgent}><input type="hidden" name="id" value={id} />
      <div className="space-y-4"><Field name="instructions" label="Instructions" rows={12} hint="What the agent does, who it helps, and how it should work. Be specific." />
      <Field name="welcome_message" label="Welcome message" rows={2} hint="Shown at the start of a website chat." /></div><SaveBar /></ActionForm></Card>;
  } else if (tab === "personality") {
    body = <Card><ActionForm action={saveAgent}><input type="hidden" name="id" value={id} />
      <div className="space-y-4"><div><label className="label" htmlFor="tone">Communication tone</label><select id="tone" name="tone" defaultValue={agent.tone} disabled={!manage} className="input">{TONES.map((t) => <option key={t} className="capitalize">{t}</option>)}</select></div>
      <Field name="personality" label="Personality" rows={6} hint="For example: warm, patient, uses plain language, never uses jargon." /></div><SaveBar /></ActionForm></Card>;
  } else if (tab === "guardrails") {
    body = <Card><ActionForm action={saveAgent}><input type="hidden" name="id" value={id} />
      <div className="space-y-4"><Field name="response_rules" label="Response rules" rows={5} hint="Format and length rules, for example: keep replies under 80 words." />
      <Field name="escalation_rules" label="Escalation rules" rows={5} hint="When the agent must hand off to a person." />
      <Field name="guardrails" label="Guardrails" rows={5} hint="Things the agent must never do or say." /></div><SaveBar /></ActionForm></Card>;
  } else if (tab === "model") {
    body = <Card><ActionForm action={saveAgent}><input type="hidden" name="id" value={id} />
      <div className="grid gap-4 md:grid-cols-2"><div><label className="label" htmlFor="provider">Provider</label><select id="provider" name="provider" defaultValue={agent.provider} disabled={!manage} className="input"><option value="anthropic">Anthropic {providers.anthropic ? "(configured)" : "(key missing)"}</option><option value="openai">OpenAI {providers.openai ? "(configured)" : "(key missing)"}</option></select></div>
      <div><label className="label" htmlFor="model">Model</label><input id="model" name="model" list="models" defaultValue={agent.model} disabled={!manage} className="input" /><datalist id="models">{[...DEFAULT_MODELS.anthropic, ...DEFAULT_MODELS.openai].map((m) => <option key={m} value={m} />)}</datalist></div></div>
      {!providers.anthropic && !providers.openai && <div className="mt-4"><ConfigBanner>No provider key is configured on the server yet.</ConfigBanner></div>}
      <SaveBar /></ActionForm></Card>;
  } else if (tab === "channels") {
    const { data: widgets } = await supabase.from("assistar_widgets").select("id, name, agent_id, active, public_key").eq("organization_id", orgId);
    body = <Card><h2 className="font-bold text-forest">Website chat widgets</h2>
      {!widgets?.length ? <p className="mt-2 text-sm text-ink-muted">No widget yet. <Link href="/dashboard/widget" className="font-semibold text-forest underline">Create one</Link> to put this agent on your website.</p> : (
        <ul className="mt-3 divide-y divide-line">{widgets.map((w) => (<li key={w.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{w.name} {w.agent_id === id && <Badge value="active" />}</span>{manage && w.agent_id !== id && <MiniForm action={attachWidget} fields={{ agentId: id, widgetId: w.id }}>Use this agent</MiniForm>}</li>))}</ul>)}
      <p className="mt-4 text-sm text-ink-muted">Email, WhatsApp, SMS and voice need provider credentials and are not connected. See <Link href="/dashboard/channels" className="font-semibold text-forest underline">Channels</Link>.</p></Card>;
  } else if (tab === "test") {
    const { data: vers } = await supabase.from("assistar_agent_versions").select("version").eq("agent_id", id).order("version", { ascending: false });
    body = <Card><AgentTester agentId={id} versions={(vers ?? []).map((v) => v.version)} current={agent.version} /></Card>;
  } else if (tab === "versions") {
    const { data: vers } = await supabase.from("assistar_agent_versions").select("version, note, created_at").eq("agent_id", id).order("version", { ascending: false });
    body = <Card><h2 className="mb-3 font-bold text-forest">Version history</h2><ul className="divide-y divide-line">
      {(vers ?? []).map((v) => (<li key={v.version} className="flex items-center justify-between gap-3 py-3 text-sm"><span><strong>Version {v.version}</strong>{v.version === agent.version && <span className="ml-2"><Badge value="active" /></span>}<span className="block text-xs text-ink-muted">{v.note || "No note"} · {timeAgo(v.created_at)}</span></span>
        {manage && v.version !== agent.version && <MiniForm action={restoreVersion} fields={{ id, version: String(v.version) }} confirm={`Restore version ${v.version}? This creates a new version with its settings.`}>Restore</MiniForm>}</li>))}</ul></Card>;
  }

  return (
    <Page>
      <PageHeader title={agent.name} description={agent.description || "Agent Studio"} actions={<Badge value={agent.status} />} />
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map(([key, label]) => (
          <Link key={key} href={`/dashboard/studio/${id}?tab=${key}`} role="tab" aria-selected={tab === key}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === key ? "border-forest text-forest" : "border-transparent text-ink-muted hover:text-ink"}`}>{label}</Link>
        ))}
      </div>
      {body}
    </Page>
  );
}
