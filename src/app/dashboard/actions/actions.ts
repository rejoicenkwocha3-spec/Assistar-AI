"use server";
import { revalidatePath } from "next/cache";
import { canManage, getContext, type ActionState } from "@/lib/context";
import { executeAction, isSafeWebhookUrl } from "@/lib/ai/engine";

const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function saveActionDef(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId, user, role } = await getContext();
  if (!canManage(role)) return { error: "Only managers and admins can define actions." };
  const id = str(fd, "id");
  const slug = str(fd, "slug", 40).toLowerCase();
  if (!/^[a-z0-9_]{2,40}$/.test(slug)) return { error: "The identifier must be 2 to 40 characters: lowercase letters, numbers and underscores." };
  const url = str(fd, "url", 500);
  if (!isSafeWebhookUrl(url)) return { error: "The URL must be a public https address." };
  let headers: Record<string, string> = {};
  const rawHeaders = str(fd, "headers", 2000);
  if (rawHeaders) {
    try {
      const parsed = JSON.parse(rawHeaders);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      headers = Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, String(v)]));
    } catch { return { error: 'Headers must be a JSON object, for example {"Authorization": "Bearer token"}.' }; }
  }
  const parameters = str(fd, "parameters", 300).split(",").map((x) => x.trim()).filter(Boolean);
  if (parameters.some((x) => !/^[A-Za-z0-9_]{1,40}$/.test(x))) return { error: "Parameter names may only contain letters, numbers and underscores." };
  const method = ["POST", "PUT", "PATCH"].includes(str(fd, "method")) ? str(fd, "method") : "POST";
  const row = { organization_id: orgId, slug, name: str(fd, "name", 120) || slug, description: str(fd, "description", 500), url, method, headers, parameters, requires_confirmation: fd.get("requires_confirmation") === "on", enabled: fd.get("enabled") === "on" };
  const { error } = id
    ? await supabase.from("assistar_actions").update(row).eq("id", id).eq("organization_id", orgId)
    : await supabase.from("assistar_actions").insert(row);
  if (error) return { error: error.code === "23505" ? "An action with this identifier already exists." : error.message };
  await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: id ? "action.updated" : "action.created", entity: "action", meta: { slug } });
  revalidatePath("/dashboard/actions");
  return { ok: true, message: "Action saved." };
}

export async function deleteActionDef(fd: FormData) {
  const { supabase, orgId, role } = await getContext();
  if (!canManage(role)) return;
  await supabase.from("assistar_actions").delete().eq("id", str(fd, "id")).eq("organization_id", orgId);
  revalidatePath("/dashboard/actions");
}

/** Approve or reject a pending agent request. Approval runs the webhook and logs the outcome. */
export async function decideExecution(fd: FormData) {
  const { supabase, orgId, user, role } = await getContext();
  if (!canManage(role)) return;
  const id = str(fd, "id"), decision = str(fd, "decision");
  const { data: exec } = await supabase.from("assistar_action_executions").select("id, action_id, input, status").eq("id", id).eq("organization_id", orgId).maybeSingle();
  if (!exec || exec.status !== "pending_approval") return;
  if (decision === "reject") {
    await supabase.from("assistar_action_executions").update({ status: "rejected", decided_by: user.id }).eq("id", id);
  } else {
    const { data: def } = await supabase.from("assistar_actions").select("url, method, headers").eq("id", exec.action_id).eq("organization_id", orgId).maybeSingle();
    if (!def || !isSafeWebhookUrl(def.url)) { await supabase.from("assistar_action_executions").update({ status: "failed", error: "Action definition missing or unsafe.", decided_by: user.id }).eq("id", id); }
    else {
      const r = await executeAction(def, exec.input as Record<string, string>);
      await supabase.from("assistar_action_executions").update({ status: r.ok ? "succeeded" : "failed", output: r.output, error: r.error, duration_ms: r.durationMs, decided_by: user.id }).eq("id", id);
    }
  }
  await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: `action.execution.${decision}`, entity: "execution", entity_id: id });
  revalidatePath("/dashboard/actions");
}

export async function testActionDef(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId, user, role } = await getContext();
  if (!canManage(role)) return { error: "Not allowed." };
  const { data: def } = await supabase.from("assistar_actions").select("*").eq("id", str(fd, "id")).eq("organization_id", orgId).maybeSingle();
  if (!def) return { error: "Action not found." };
  if (!isSafeWebhookUrl(def.url)) return { error: "The action URL is not a public https address." };
  let input: Record<string, string> = {};
  const raw = str(fd, "input", 2000);
  if (raw) { try { const p = JSON.parse(raw); input = Object.fromEntries(def.parameters.filter((k: string) => p[k] != null).map((k: string) => [k, String(p[k])])); } catch { return { error: "Test input must be a JSON object." }; } }
  const r = await executeAction(def, input);
  await supabase.from("assistar_action_executions").insert({ organization_id: orgId, action_id: def.id, input, status: r.ok ? "succeeded" : "failed", output: r.output, error: r.error, duration_ms: r.durationMs, requested_by: "test", decided_by: user.id });
  revalidatePath("/dashboard/actions");
  return r.ok ? { ok: true, message: `Succeeded in ${r.durationMs} ms. Response: ${(r.output ?? "").slice(0, 200)}` } : { error: `Failed: ${r.error}` };
}
