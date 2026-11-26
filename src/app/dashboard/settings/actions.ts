"use server";
import { revalidatePath } from "next/cache";
import { getContext, isAdmin, type ActionState } from "@/lib/context";

export async function saveOrganization(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, orgId, user, role } = await getContext();
  if (!isAdmin(role)) return { error: "Only owners and admins can change workspace settings." };
  const name = String(fd.get("name") ?? "").trim().slice(0, 120);
  if (name.length < 2) return { error: "Enter a business name." };
  const website = String(fd.get("website") ?? "").trim().slice(0, 200);
  const { error } = await supabase.from("organizations").update({ name, website: website || null, industry: String(fd.get("industry") ?? "").slice(0, 80) || null, description: String(fd.get("description") ?? "").trim().slice(0, 1000) || null }).eq("id", orgId);
  if (error) return { error: error.message };
  await supabase.from("assistar_audit_logs").insert({ organization_id: orgId, user_id: user.id, action: "organization.updated", entity: "organization", entity_id: orgId });
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Workspace saved." };
}

export async function saveProfile(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await getContext();
  const name = String(fd.get("full_name") ?? "").trim().slice(0, 100);
  if (name.length < 2) return { error: "Enter your name." };
  const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Profile saved." };
}
