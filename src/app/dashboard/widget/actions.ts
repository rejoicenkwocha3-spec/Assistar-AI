"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canManage, getContext, type ActionState } from "@/lib/context";

export async function createWidget() {
  const { supabase, orgId, role } = await getContext();
  if (!canManage(role)) return;
  const { data: agent } = await supabase.from("assistar_agents").select("id, welcome_message, name").eq("organization_id", orgId).order("created_at").limit(1).maybeSingle();
  const { data } = await supabase.from("assistar_widgets").insert({ organization_id: orgId, agent_id: agent?.id ?? null, assistant_name: agent?.name ?? "Assistant", welcome_message: agent?.welcome_message ?? undefined }).select("id").single();
  revalidatePath("/dashboard/widget");
  if (data) redirect(`/dashboard/widget?w=${data.id}`);
}

export async function saveWidget(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId, role } = await getContext();
  if (!canManage(role)) return { error: "Only managers and admins can change widgets." };
  const id = String(fd.get("id") ?? "");
  const color = String(fd.get("brand_color") ?? "");
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: "Choose a valid brand color." };
  const logo = String(fd.get("logo_url") ?? "").trim();
  if (logo && !/^https:\/\/\S+$/.test(logo)) return { error: "The logo must be an https image URL." };
  const agentId = String(fd.get("agent_id") ?? "") || null;
  const { error } = await supabase.from("assistar_widgets").update({
    name: String(fd.get("name") ?? "").trim().slice(0, 80) || "Website chat",
    assistant_name: String(fd.get("assistant_name") ?? "").trim().slice(0, 60) || "Assistant",
    welcome_message: String(fd.get("welcome_message") ?? "").trim().slice(0, 500) || "Hello. How can I help you today?",
    brand_color: color, logo_url: logo || null, agent_id: agentId, active: fd.get("active") === "on",
  }).eq("id", id).eq("organization_id", orgId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/widget");
  return { ok: true, message: "Widget saved." };
}

export async function deleteWidget(fd: FormData) {
  const { supabase, orgId, role } = await getContext();
  if (!canManage(role)) return;
  await supabase.from("assistar_widgets").delete().eq("id", String(fd.get("id") ?? "")).eq("organization_id", orgId);
  revalidatePath("/dashboard/widget");
  redirect("/dashboard/widget");
}
