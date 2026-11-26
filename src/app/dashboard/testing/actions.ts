"use server";
import { revalidatePath } from "next/cache";
import { canManage, getContext, type ActionState } from "@/lib/context";
import { runAgent, type AgentConfig } from "@/lib/ai/engine";
import { providerStatus } from "@/lib/ai/providers";

const str = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function saveScenario(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId, role } = await getContext();
  if (!canManage(role)) return { error: "Only managers and admins can save scenarios." };
  const prompt = str(fd, "prompt");
  if (!prompt) return { error: "Write the customer message to test." };
  const { error } = await supabase.from("assistar_test_scenarios").insert({ organization_id: orgId, agent_id: str(fd, "agent_id"), name: str(fd, "name", 120) || prompt.slice(0, 60), prompt, expected: str(fd, "expected") });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/testing");
  return { ok: true, message: "Scenario saved." };
}

export async function deleteScenario(fd: FormData) {
  const { supabase, orgId, role } = await getContext();
  if (!canManage(role)) return;
  await supabase.from("assistar_test_scenarios").delete().eq("id", str(fd, "id")).eq("organization_id", orgId);
  revalidatePath("/dashboard/testing");
}

export async function runScenario(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId, user, role } = await getContext();
  if (!canManage(role)) return { error: "Only managers and admins can run tests." };
  const { data: sc } = await supabase.from("assistar_test_scenarios").select("*").eq("id", str(fd, "id")).eq("organization_id", orgId).maybeSingle();
  if (!sc) return { error: "Scenario not found." };
  const { data: agent } = await supabase.from("assistar_agents").select("*").eq("id", sc.agent_id).eq("organization_id", orgId).maybeSingle();
  if (!agent) return { error: "Agent not found." };
  const version = Number(fd.get("version")) || agent.version;
  let cfg = agent as AgentConfig;
  if (version !== agent.version) {
    const { data: ver } = await supabase.from("assistar_agent_versions").select("snapshot").eq("agent_id", agent.id).eq("version", version).maybeSingle();
    if (!ver) return { error: `Version ${version} not found.` };
    cfg = { ...agent, ...(ver.snapshot as object) } as AgentConfig;
  }
  const record = (extra: Record<string, unknown>) => supabase.from("assistar_test_runs").insert({ organization_id: orgId, scenario_id: sc.id, agent_id: agent.id, agent_version: version, prompt: sc.prompt, created_by: user.id, ...extra });
  if (!providerStatus()[cfg.provider]) {
    await record({ error: `${cfg.provider} API key is not configured on the server.` });
    revalidatePath("/dashboard/testing");
    return { error: `The ${cfg.provider} API key is not configured on the server, so the test could not run.` };
  }
  try {
    const r = await runAgent(supabase, { orgId, agent: cfg, history: [{ role: "user", content: sc.prompt }] });
    await record({ response: r.reply + (r.escalate ? `\n\n[Would hand off to a human${r.escalationReason ? `: ${r.escalationReason}` : ""}]` : ""), latency_ms: r.latencyMs });
  } catch (e) {
    await record({ error: e instanceof Error ? e.message : "Model call failed" });
  }
  revalidatePath("/dashboard/testing");
  return { ok: true, message: `Ran against version ${version}. See the result below.` };
}

export async function setVerdict(fd: FormData) {
  const { supabase, orgId, role } = await getContext();
  if (!canManage(role)) return;
  const verdict = str(fd, "verdict");
  if (!["pass", "fail"].includes(verdict)) return;
  await supabase.from("assistar_test_runs").update({ verdict }).eq("id", str(fd, "id")).eq("organization_id", orgId);
  revalidatePath("/dashboard/testing");
}
