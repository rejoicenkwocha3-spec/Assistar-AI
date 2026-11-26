"use server";
import { revalidatePath } from "next/cache";
import { getContext, isAdmin, type ActionState } from "@/lib/context";
import { isSlackWebhook, postSlack } from "@/lib/notify";

export async function connectSlack(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId, user, role } = await getContext();
  if (!isAdmin(role)) return { error: "Only owners and admins can manage integrations." };
  const url = String(fd.get("webhook_url") ?? "").trim();
  if (!isSlackWebhook(url)) return { error: "Enter a Slack incoming webhook URL. It starts with https://hooks.slack.com/services/." };
  // Only mark connected after a real message was delivered.
  const r = await postSlack(url, "Assistar AI connected successfully. Escalated conversations will be announced in this channel.");
  const row = { organization_id: orgId, provider: "slack", config: { webhook_url: url }, status: r.ok ? "connected" : "error", last_tested_at: new Date().toISOString(), last_error: r.ok ? null : r.error };
  await supabase.from("assistar_integrations").upsert(row, { onConflict: "organization_id,provider" });
  await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: r.ok ? "integration.connected" : "integration.failed", entity: "integration", meta: { provider: "slack" } });
  revalidatePath("/dashboard/integrations");
  return r.ok ? { ok: true, message: "Connected. A test message was posted to your Slack channel." } : { error: `Could not connect: ${r.error}` };
}

export async function disconnectIntegration(fd: FormData) {
  const { supabase, orgId, role } = await getContext();
  if (!isAdmin(role)) return;
  await supabase.from("assistar_integrations").delete().eq("organization_id", orgId).eq("provider", String(fd.get("provider")));
  revalidatePath("/dashboard/integrations");
}
