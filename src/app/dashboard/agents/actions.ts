"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canManage, getContext, type ActionState } from "@/lib/context";
import { TEMPLATES, CUSTOM_TEMPLATE } from "@/config/templates";
import { snapshotOf } from "@/lib/agents";

const text = (fd: FormData, k: string, max = 4000) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function createAgent(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId, user, role } = await getContext();
  if (!canManage(role)) return { error: "Only managers and admins can create agents." };
  const tpl = [...TEMPLATES, CUSTOM_TEMPLATE].find((t) => t.key === text(fd, "template")) ?? CUSTOM_TEMPLATE;
  const name = text(fd, "name", 120) || tpl.name;
  const row = {
    organization_id: orgId, name, description: text(fd, "description", 500) || tpl.description, template: tpl.key,
    instructions: tpl.instructions, tone: tpl.tone, escalation_rules: tpl.escalation, welcome_message: tpl.welcome, created_by: user.id,
  };
  const { data, error } = await supabase.from("assistar_agents").insert(row).select("*").single();
  if (error || !data) return { error: error?.message ?? "Could not create the agent." };
  await supabase.from("assistar_agent_versions").insert({ organization_id: orgId, agent_id: data.id, version: 1, snapshot: snapshotOf(data), note: "Created", created_by: user.id });
  await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: "agent.created", entity: "agent", entity_id: data.id, meta: { name } });
  revalidatePath("/dashboard/agents");
  redirect(`/dashboard/studio/${data.id}`);
}

export async function setAgentStatus(fd: FormData) {
  const { supabase, orgId, user, role } = await getContext();
  if (!canManage(role)) return;
  const id = text(fd, "id"), status = text(fd, "status");
  if (!["draft", "published", "paused"].includes(status)) return;
  let patch: Record<string, unknown> = { status };
  if (status === "published") {
    const { data: a } = await supabase.from("assistar_agents").select("*").eq("id", id).eq("organization_id", orgId).maybeSingle();
    if (!a) return;
    patch = { status, published_config: snapshotOf(a), published_version: a.version };
  }
  await supabase.from("assistar_agents").update(patch).eq("id", id).eq("organization_id", orgId);
  await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: `agent.${status}`, entity: "agent", entity_id: id });
  revalidatePath("/dashboard/agents"); revalidatePath(`/dashboard/studio/${id}`);
}

export async function deleteAgent(fd: FormData) {
  const { supabase, orgId, user, role } = await getContext();
  if (!canManage(role)) return;
  const id = text(fd, "id");
  await supabase.from("assistar_agents").delete().eq("id", id).eq("organization_id", orgId);
  await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: "agent.deleted", entity: "agent", entity_id: id });
  revalidatePath("/dashboard/agents");
}
