"use server";
import { revalidatePath } from "next/cache";
import { canManage, getContext, type ActionState } from "@/lib/context";
import { SNAPSHOT_KEYS, snapshotOf } from "@/lib/agents";
import { runAgent, type AgentConfig } from "@/lib/ai/engine";
import { providerStatus } from "@/lib/ai/providers";

const FIELD_LIMITS: Record<string, number> = { name: 120, description: 500, instructions: 8000, personality: 2000, tone: 40, provider: 20, model: 80, welcome_message: 500, response_rules: 3000, escalation_rules: 3000, guardrails: 3000 };

export async function saveAgent(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId, user, role } = await getContext();
  if (!canManage(role)) return { error: "Only managers and admins can edit agents." };
  const id = String(fd.get("id") ?? "");
  const note = String(fd.get("note") ?? "").trim().slice(0, 200) || "Edited";

  const patch: Record<string, string> = {};
  for (const k of SNAPSHOT_KEYS) {
    if (fd.has(k)) patch[k] = String(fd.get(k) ?? "").trim().slice(0, FIELD_LIMITS[k]);
  }
  if ("name" in patch && !patch.name) return { error: "The agent needs a name." };
  if ("provider" in patch && !["anthropic", "openai"].includes(patch.provider)) return { error: "Unknown provider." };
  if ("model" in patch && !/^[A-Za-z0-9._:-]{2,80}$/.test(patch.model)) return { error: "Enter a valid model identifier." };

  const { data: current } = await supabase.from("assistar_agents").select("version").eq("id", id).eq("organization_id", orgId).maybeSingle();
  if (!current) return { error: "Agent not found." };
  const version = current.version + 1;
  const { data, error } = await supabase.from("assistar_agents").update({ ...patch, version }).eq("id", id).eq("organization_id", orgId).select("*").single();
  if (error || !data) return { error: error?.message ?? "Could not save." };
  await supabase.from("assistar_agent_versions").insert({ organization_id: orgId, agent_id: id, version, snapshot: snapshotOf(data), note, created_by: user.id });
  await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: "agent.updated", entity: "agent", entity_id: id, meta: { version, note } });
  revalidatePath(`/dashboard/studio/${id}`);
  return { ok: true, message: `Saved as version ${version}. Publishing is a separate step, so customers still see the published configuration until you publish.` };
}

export async function restoreVersion(fd: FormData) {
  const { supabase, orgId, user, role } = await getContext();
  if (!canManage(role)) return;
  const id = String(fd.get("id") ?? ""), v = Number(fd.get("version"));
  const { data: ver } = await supabase.from("assistar_agent_versions").select("snapshot").eq("agent_id", id).eq("organization_id", orgId).eq("version", v).maybeSingle();
  const { data: current } = await supabase.from("assistar_agents").select("version").eq("id", id).eq("organization_id", orgId).maybeSingle();
  if (!ver || !current) return;
  const version = current.version + 1;
  const snap = ver.snapshot as Record<string, string>;
  const patch = Object.fromEntries(SNAPSHOT_KEYS.map((k) => [k, snap[k]]));
  const { data } = await supabase.from("assistar_agents").update({ ...patch, version }).eq("id", id).eq("organization_id", orgId).select("*").single();
  if (!data) return;
  await supabase.from("assistar_agent_versions").insert({ organization_id: orgId, agent_id: id, version, snapshot: snapshotOf(data), note: `Restored version ${v}`, created_by: user.id });
  await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: "agent.restored", entity: "agent", entity_id: id, meta: { from: v, to: version } });
  revalidatePath(`/dashboard/studio/${id}`);
}

export type TestReply = { reply?: string; error?: string; escalate?: boolean; reason?: string; kbHits?: number; sources?: string[]; latencyMs?: number; actions?: string[] };

/** Test chat against the saved configuration (or a chosen earlier version). Nothing is published or stored as a customer conversation. */
export async function testAgent(agentId: string, history: { role: "user" | "assistant"; content: string }[], version?: number): Promise<TestReply> {
  const { supabase, orgId } = await getContext();
  const p = providerStatus();
  const { data: agent } = await supabase.from("assistar_agents").select("*").eq("id", agentId).eq("organization_id", orgId).maybeSingle();
  if (!agent) return { error: "Agent not found." };
  let cfg = agent as AgentConfig;
  if (version && version !== agent.version) {
    const { data: ver } = await supabase.from("assistar_agent_versions").select("snapshot").eq("agent_id", agentId).eq("version", version).maybeSingle();
    if (!ver) return { error: `Version ${version} not found.` };
    cfg = { ...agent, ...(ver.snapshot as object) } as AgentConfig;
  }
  if (!p[cfg.provider]) return { error: `${cfg.provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY"} is not set on the server, so this agent cannot reply yet. Add it in your hosting environment variables and redeploy.` };
  if (!history.length || history[history.length - 1].role !== "user") return { error: "Send a message first." };
  try {
    const r = await runAgent(supabase, { orgId, agent: cfg, history: history.slice(-20).map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })), useActions: true });
    return { reply: r.reply, escalate: r.escalate, reason: r.escalationReason, kbHits: r.kbHits, sources: r.sources, latencyMs: r.latencyMs, actions: r.actions.map((a) => a.slug) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The model call failed." };
  }
}

export async function attachWidget(fd: FormData) {
  const { supabase, orgId, role } = await getContext();
  if (!canManage(role)) return;
  const agentId = String(fd.get("agentId") ?? ""), widgetId = String(fd.get("widgetId") ?? "");
  await supabase.from("assistar_widgets").update({ agent_id: agentId }).eq("id", widgetId).eq("organization_id", orgId);
  revalidatePath(`/dashboard/studio/${agentId}`);
}
